import React, { useState } from "react";
import type { TouristSpotCreateInput } from "@tourism/shared";

interface CreateSpotFormProps {
  token: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const CreateSpotForm: React.FC<CreateSpotFormProps> = ({ token, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState<TouristSpotCreateInput>({
    name: "",
    description: "",
    city: "",
    state: "",
    country: "",
    address: "",
    lat: 0,
    lng: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/spots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        onSuccess();
        // Reset form
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
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Failed to create spot");
      }
    } catch (err) {
      setError("Failed to create spot. Please try again.");
      console.error("Error creating spot:", err);
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
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: "1rem" }}>Create New Tourist Spot</h2>
      
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          <div>
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
              }}
            />
          </div>

          <div>
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
              }}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          <div>
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
              }}
            />
          </div>

          <div>
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
            }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
              Latitude * (e.g., -15.7942)
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
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
              Longitude * (e.g., -47.8822)
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
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
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
            }}
          >
            Cancel
          </button>
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
              fontSize: "0.9rem",
              fontWeight: "500",
            }}
          >
            {loading ? "Creating..." : "Create Spot"}
          </button>
        </div>
      </form>
    </div>
  );
};

