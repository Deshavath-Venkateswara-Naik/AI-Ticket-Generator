const API_BASE = "http://127.0.0.1:8000";

export const generateTicket = async (message) => {

    const res = await fetch(`${API_BASE}/generate-ticket`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ message })
    });

    return res.json();
};

export const fetchCategories = async () => {

    const res = await fetch(`${API_BASE}/categories`);
    const data = await res.json();
    return data.categories;
};