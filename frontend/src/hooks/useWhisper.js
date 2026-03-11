import { useState, useRef, useCallback } from "react";
import { pipeline } from "@xenova/transformers";

// Singleton: load the Whisper pipeline once
let whisperPipeline = null;
let pipelineLoading = false;
let pipelinePromise = null;

async function getWhisperPipeline(onProgress) {
    if (whisperPipeline) return whisperPipeline;
    if (pipelineLoading) return pipelinePromise;

    pipelineLoading = true;
    pipelinePromise = pipeline(
        "automatic-speech-recognition",
        "Xenova/whisper-tiny.en",
        { progress_callback: onProgress }
    );
    whisperPipeline = await pipelinePromise;
    pipelineLoading = false;
    return whisperPipeline;
}

/**
 * Convert an audio Blob to a Float32Array of 16 kHz mono PCM samples,
 * which is what the Whisper model expects.
 */
async function audioBlobToFloat32(blob) {
    const arrayBuffer = await blob.arrayBuffer();
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000,
    });
    const decoded = await audioCtx.decodeAudioData(arrayBuffer);
    const float32 = decoded.getChannelData(0); // mono channel
    audioCtx.close();
    return float32;
}

/**
 * Custom React hook that provides granular voice controls:
 *  - isRecording: whether the mic is active
 *  - isPaused: whether recording is paused
 *  - isTranscribing: whether local Whisper is processing
 *  - transcript: the local transcript text (optional)
 *  - modelProgress: loading progress %
 *  - audioBlob: the recorded audio data
 *  - startRecording / pauseRecording / resumeRecording / stopRecording / transcribeAudio / clearTranscript
 */
export function useWhisper() {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [modelProgress, setModelProgress] = useState(null);
    const [audioBlob, setAudioBlob] = useState(null);

    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const streamRef = useRef(null);

    const handleProgress = useCallback((progress) => {
        if (progress.status === "progress" && progress.progress !== undefined) {
            setModelProgress(Math.round(progress.progress));
        }
        if (progress.status === "ready") {
            setModelProgress(100);
        }
    }, []);

    const startRecording = useCallback(async () => {
        console.log("[useWhisper] Starting microphone recording...");
        setAudioBlob(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                console.log("[useWhisper] MediaRecorder stopped.");
                const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                setAudioBlob(blob);

                // Stop all mic tracks
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach((t) => t.stop());
                    streamRef.current = null;
                }
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start();
            setIsRecording(true);
            setIsPaused(false);
        } catch (err) {
            console.error("Microphone access denied:", err);
        }
    }, []);

    const pauseRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.pause();
            setIsPaused(true);
            console.log("[useWhisper] Recording paused.");
        }
    }, []);

    const resumeRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
            mediaRecorderRef.current.resume();
            setIsPaused(false);
            console.log("[useWhisper] Recording resumed.");
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
        setIsPaused(false);
    }, []);

    const transcribeAudio = useCallback(async () => {
        if (!audioBlob) {
            console.warn("[useWhisper] No audio blob available to transcribe.");
            return;
        }

        setIsTranscribing(true);
        console.log("[useWhisper] Local transcription starting...");

        try {
            console.log("[useWhisper] Converting blob to PCM 16kHz...");
            const pcm = await audioBlobToFloat32(audioBlob);

            console.log("[useWhisper] Loading Whisper pipeline and transcribing...");
            const transcriber = await getWhisperPipeline(handleProgress);
            const result = await transcriber(pcm);
            console.log("[useWhisper] Transcription result:", result);

            if (result && result.text) {
                setTranscript(result.text.trim());
            } else {
                console.warn("[useWhisper] Empty transcription result.");
            }
        } catch (err) {
            console.error("Whisper transcription error:", err);
        } finally {
            setIsTranscribing(false);
        }
    }, [audioBlob, handleProgress]);

    const clearTranscript = useCallback(() => {
        setTranscript("");
        setAudioBlob(null);
    }, []);

    return {
        isRecording,
        isPaused,
        isTranscribing,
        transcript,
        setTranscript,
        modelProgress,
        audioBlob,
        startRecording,
        pauseRecording,
        resumeRecording,
        stopRecording,
        transcribeAudio,
        clearTranscript,
    };
}
