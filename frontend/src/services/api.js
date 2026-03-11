const API_BASE = "http://127.0.0.1:8000";

export const generateTicket = async (message) => {
    const res = await fetch(`${API_BASE}/generate-ticket`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ message })
    }).catch(err => {
        console.error("[api] fetch error for generate-ticket:", err);
        throw err;
    });

    const data = await res.json();
    console.log("[api] generate-ticket response:", data);
    return data;
};

export const generateTicketsFromImage = async (imageFile) => {
    const formData = new FormData();
    formData.append("file", imageFile);

    const res = await fetch(`${API_BASE}/generate-tickets-from-image`, {
        method: "POST",
        body: formData,
    });

    return res.json();
};

export const fetchCategories = async () => {
    const res = await fetch(`${API_BASE}/categories`);
    const data = await res.json();
    return data.categories;
};

export const generateTicketFromAudio = async (audioBlob) => {
    console.log("[api] generateTicketFromAudio called with blob size:", audioBlob.size);
    const formData = new FormData();
    formData.append("file", audioBlob, "recording.webm");

    const res = await fetch(`${API_BASE}/generate-ticket-audio`, {
        method: "POST",
        body: formData,
    }).catch(err => {
        console.error("[api] fetch error for generate-ticket-audio:", err);
        throw err;
    });

    const data = await res.json();
    console.log("[api] generate-ticket-audio response:", data);
    return data;
};