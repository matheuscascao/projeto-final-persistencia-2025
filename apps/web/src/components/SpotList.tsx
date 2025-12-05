import React, { useEffect, useState } from "react";
import type { TouristSpot } from "@tourism/shared";
import { SpotCard } from "./SpotCard";

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
  const [filters, setFilters] = useState({
    city: "",
    minRating: "",
    search: "",
  });

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
        <div style={{ display: "flex", gap: "0.5rem" }}>
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
        </div>
      </div>

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
              <SpotCard key={spot.id} spot={spot} token={token} onUpdate={loadSpots} />
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


