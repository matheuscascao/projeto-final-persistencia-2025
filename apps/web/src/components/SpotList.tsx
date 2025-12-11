import React, { useEffect, useState } from "react";
import type { TouristSpot } from "@tourism/shared";
import { SpotCard } from "./SpotCard";
import { SpotForm } from "./SpotForm";

interface SpotListProps {
  token: string;
  user: any;
}

export const SpotList: React.FC<SpotListProps> = ({ token, user }) => {
  const [spots, setSpots] = useState<TouristSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filters, setFilters] = useState({
    city: "",
    minRating: "",
    search: "",
  });

  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Check if user is admin - handle both string and case variations
  const isAdmin = user?.role === "ADMIN" || user?.role === "admin" || user?.role?.toUpperCase() === "ADMIN";

  // Debug: Log user object to see what we're getting
  React.useEffect(() => {
    console.log("SpotList - User object:", user);
    console.log("SpotList - User role:", user?.role, "Type:", typeof user?.role);
    console.log("SpotList - Is Admin:", isAdmin);

    if (token) {
      loadFavorites();
    }
  }, [user, isAdmin, token]);

  const loadFavorites = async () => {
    try {
      const res = await fetch("/api/favorites", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Assuming data is array of { spotId: string, ... }
        const favIds = new Set<string>(data.map((f: any) => f.spotId));
        setFavorites(favIds);
      }
    } catch (err) {
      console.error("Failed to load favorites:", err);
    }
  }

  const handleToggleFavorite = async (spotId: string) => {
    if (!token) return;

    const isFav = favorites.has(spotId);

    // Optimistic update
    const newFavorites = new Set(favorites);
    if (isFav) {
      newFavorites.delete(spotId);
    } else {
      newFavorites.add(spotId);
    }
    setFavorites(newFavorites);

    try {
      const method = isFav ? "DELETE" : "POST";
      const res = await fetch(`/api/favorites/${spotId}`, {
        method,
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        // Revert on failure
        setFavorites(favorites);
        console.error("Failed to toggle favorite");
      }
    } catch (err) {
      setFavorites(favorites);
      console.error("Error toggling favorite:", err);
    }
  };

  const loadSpots = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "6",
        ...(filters.city && { city: filters.city }),
        ...(filters.minRating && { minRating: filters.minRating }),
        ...(filters.search && { search: filters.search }),
        sortBy: "rating",
        sortOrder: "desc",
      });

      const res = await fetch(`/api/spots?${params}`);
      if (!res.ok) {
        throw new Error(`Failed to load spots (${res.status})`);
      }
      const data = await res.json();
      setSpots(data.data || data);
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unexpected error loading spots"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSpots();
  }, [page, filters]);

  const handleExport = async (format: string) => {
    try {
      const res = await fetch(`/api/export/spots?format=${format}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tourist-spots.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed");
    }
  };

  if (loading && spots.length === 0) {
    return <p>Loading tourist spots...</p>;
  }

  if (error && spots.length === 0) {
    return (
      <div style={{ color: "#b00020" }}>
        <p>Could not load tourist spots.</p>
        <pre style={{ whiteSpace: "pre-wrap" }}>{error}</pre>
      </div>
    );
  }

  return (
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
        <h2 style={{ fontSize: "1.25rem", margin: 0 }}>Tourist Spots</h2>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {isAdmin && (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: showCreateForm ? "#6c757d" : "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: "500",
              }}
            >
              {showCreateForm ? "Cancel" : "+ Create Spot"}
            </button>
          )}
          <button
            onClick={() => handleExport("json")}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#4caf50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            Export JSON
          </button>
          <button
            onClick={() => handleExport("csv")}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#4caf50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            Export CSV
          </button>
          <button
            onClick={() => handleExport("xml")}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#4caf50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            Export XML
          </button>

          {isAdmin && (
            <>
              <input
                type="file"
                id="import-file"
                style={{ display: "none" }}
                accept=".json,.csv,.xml"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  const ext = file.name.split(".").pop()?.toLowerCase();
                  if (!["json", "csv", "xml"].includes(ext || "")) {
                    alert("Invalid file format. Please use .json, .csv, or .xml");
                    return;
                  }

                  const formData = new FormData();
                  formData.append("file", file);
                  formData.append("format", ext!);

                  try {
                    const res = await fetch("/api/import/spots", {
                      method: "POST",
                      headers: {
                        Authorization: `Bearer ${token}`
                      },
                      body: formData
                    });

                    const data = await res.json();

                    if (res.ok) {
                      alert(`Import completed: ${data.results.successful} successful, ${data.results.failed} failed.`);
                      void loadSpots();
                    } else {
                      alert(data.error || "Import failed");
                    }
                  } catch (error) {
                    console.error("Import error:", error);
                    alert("Failed to import spots");
                  }

                  // Reset input
                  e.target.value = "";
                }}
              />
              <button
                onClick={() => document.getElementById("import-file")?.click()}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: "500",
                }}
              >
                Import Data
              </button>
            </>
          )}
        </div>
      </div>

      {/* Create Spot Form (Admin only) */}
      {isAdmin && showCreateForm && (
        <SpotForm
          token={token}
          onSuccess={() => {
            setShowCreateForm(false);
            void loadSpots();
          }}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Filters */}
      <div style={{ marginBottom: "1rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Search spots..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          style={{ padding: "0.5rem", fontSize: "0.9rem", flex: "1", minWidth: "200px" }}
        />
        <input
          type="text"
          placeholder="Filter by city..."
          value={filters.city}
          onChange={(e) => setFilters({ ...filters, city: e.target.value })}
          style={{ padding: "0.5rem", fontSize: "0.9rem", minWidth: "150px" }}
        />
        <input
          type="number"
          placeholder="Min rating"
          min="1"
          max="5"
          value={filters.minRating}
          onChange={(e) => setFilters({ ...filters, minRating: e.target.value })}
          style={{ padding: "0.5rem", fontSize: "0.9rem", width: "120px" }}
        />
      </div>

      {spots.length === 0 ? (
        <p>No tourist spots found yet.</p>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "1rem",
            }}
          >
            {spots.map((spot) => (
              <SpotCard
                key={spot.id}
                spot={spot}
                token={token}
                user={user}
                onUpdate={loadSpots}
                isFavorite={favorites.has(spot.id)}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ marginTop: "2rem", display: "flex", justifyContent: "center", gap: "0.5rem" }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: page === 1 ? "#ccc" : "#1976d2",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: page === 1 ? "not-allowed" : "pointer",
                }}
              >
                Previous
              </button>
              <span style={{ padding: "0.5rem 1rem", display: "flex", alignItems: "center" }}>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: page === totalPages ? "#ccc" : "#1976d2",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: page === totalPages ? "not-allowed" : "pointer",
                }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
};


