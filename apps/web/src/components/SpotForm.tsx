import React, { useState, useEffect } from "react";
import type { TouristSpotCreateInput, TouristSpot } from "@tourism/shared";

interface SpotFormProps {
    token: string;
    initialData?: TouristSpot;
    onSuccess: () => void;
    onCancel: () => void;
}

export const SpotForm: React.FC<SpotFormProps> = ({ token, initialData, onSuccess, onCancel }) => {
    const isEditing = !!initialData;
    const [formData, setFormData] = useState<TouristSpotCreateInput>({
        name: initialData?.name || "",
        description: initialData?.description || "",
        city: initialData?.city || "",
        state: initialData?.state || "",
        country: initialData?.country || "",
        address: initialData?.address || "",
        lat: initialData?.lat ? parseFloat(String(initialData.lat)) : 0,
        lng: initialData?.lng ? parseFloat(String(initialData.lng)) : 0,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const url = isEditing && initialData
                ? `/api/spots/${initialData.id}`
                : "/api/spots";

            const method = isEditing ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                onSuccess();
                if (!isEditing) {
                    // Reset form only on create
                    setFormData({
                        name: "",
                        description: "",
                        city: "",
                        state: "",
                        country: "",
                        address: "",
                        lat: 0,
                        lng: 0,
                    });
                }
            } else {
                const errorData = await res.json();
                setError(errorData.error || `Failed to ${isEditing ? "update" : "create"} spot`);
            }
        } catch (err) {
            setError(`Failed to ${isEditing ? "update" : "create"} spot. Please try again.`);
            console.error("Error saving spot:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev: TouristSpotCreateInput) => ({
            ...prev,
            [name]: name === "lat" || name === "lng" ? parseFloat(value) || 0 : value,
        }));
    };

    return (
        <div
            style={{
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                padding: "1.5rem",
                marginBottom: "2rem",
                backgroundColor: "#f9fafb",
                maxWidth: "100%",
                boxSizing: "border-box",
            }}
        >
            <h2 style={{ marginTop: 0, marginBottom: "1rem" }}>
                {isEditing ? "Edit Tourist Spot" : "Create New Tourist Spot"}
            </h2>

            {error && (
                <div
                    style={{
                        padding: "0.75rem",
                        marginBottom: "1rem",
                        backgroundColor: "#fee",
                        color: "#c33",
                        borderRadius: "4px",
                    }}
                >
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
                    <div style={{ flex: "1 1 200px" }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                            Name *
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            style={{
                                width: "100%",
                                padding: "0.5rem",
                                border: "1px solid #ccc",
                                borderRadius: "4px",
                                fontSize: "0.9rem",
                                boxSizing: "border-box",
                            }}
                        />
                    </div>

                    <div style={{ flex: "1 1 200px" }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                            City *
                        </label>
                        <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            required
                            style={{
                                width: "100%",
                                padding: "0.5rem",
                                border: "1px solid #ccc",
                                borderRadius: "4px",
                                fontSize: "0.9rem",
                                boxSizing: "border-box",
                            }}
                        />
                    </div>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
                    <div style={{ flex: "1 1 150px" }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                            State *
                        </label>
                        <input
                            type="text"
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                            required
                            style={{
                                width: "100%",
                                padding: "0.5rem",
                                border: "1px solid #ccc",
                                borderRadius: "4px",
                                fontSize: "0.9rem",
                                boxSizing: "border-box",
                            }}
                        />
                    </div>

                    <div style={{ flex: "1 1 150px" }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                            Country *
                        </label>
                        <input
                            type="text"
                            name="country"
                            value={formData.country}
                            onChange={handleChange}
                            required
                            style={{
                                width: "100%",
                                padding: "0.5rem",
                                border: "1px solid #ccc",
                                borderRadius: "4px",
                                fontSize: "0.9rem",
                                boxSizing: "border-box",
                            }}
                        />
                    </div>
                </div>

                <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                        Address *
                    </label>
                    <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        required
                        style={{
                            width: "100%",
                            padding: "0.5rem",
                            border: "1px solid #ccc",
                            borderRadius: "4px",
                            fontSize: "0.9rem",
                            boxSizing: "border-box",
                        }}
                    />
                </div>

                <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                        Description *
                    </label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        rows={4}
                        style={{
                            width: "100%",
                            padding: "0.5rem",
                            border: "1px solid #ccc",
                            borderRadius: "4px",
                            fontSize: "0.9rem",
                            resize: "vertical",
                            boxSizing: "border-box",
                        }}
                    />
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
                    <div style={{ flex: "1 1 150px" }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                            Latitude *
                        </label>
                        <input
                            type="number"
                            name="lat"
                            value={formData.lat}
                            onChange={handleChange}
                            required
                            step="any"
                            min="-90"
                            max="90"
                            style={{
                                width: "100%",
                                padding: "0.5rem",
                                border: "1px solid #ccc",
                                borderRadius: "4px",
                                fontSize: "0.9rem",
                                boxSizing: "border-box",
                            }}
                        />
                    </div>

                    <div style={{ flex: "1 1 150px" }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                            Longitude *
                        </label>
                        <input
                            type="number"
                            name="lng"
                            value={formData.lng}
                            onChange={handleChange}
                            required
                            step="any"
                            min="-180"
                            max="180"
                            style={{
                                width: "100%",
                                padding: "0.5rem",
                                border: "1px solid #ccc",
                                borderRadius: "4px",
                                fontSize: "0.9rem",
                                boxSizing: "border-box",
                            }}
                        />
                    </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            padding: "0.75rem 1.5rem",
                            backgroundColor: "#28a745",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: loading ? "not-allowed" : "pointer",
                            fontSize: "1rem",
                            fontWeight: "500",
                            width: "100%",
                        }}
                    >
                        {loading ? "Saving..." : (isEditing ? "Update Spot" : "Create Spot")}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        style={{
                            padding: "0.75rem 1.5rem",
                            backgroundColor: "#6c757d",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: loading ? "not-allowed" : "pointer",
                            fontSize: "0.9rem",
                            width: "100%",
                        }}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};
