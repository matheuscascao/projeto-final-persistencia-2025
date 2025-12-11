import React, { useState, useEffect } from "react";
import type { TouristSpot } from "@tourism/shared";
import { SpotForm } from "./SpotForm";

interface SpotCardProps {
  spot: TouristSpot;
  token: string | null;
  user?: any;
  onUpdate: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (spotId: string) => void;
}

export const SpotCard: React.FC<SpotCardProps> = ({ spot, token, user, onUpdate, isFavorite, onToggleFavorite }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [ratings, setRatings] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [lodgings, setLodgings] = useState<any[]>([]);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [ratingComment, setRatingComment] = useState("");
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(false);

  // Lodging Form State
  const [showLodgingForm, setShowLodgingForm] = useState(false);
  const [lodgingForm, setLodgingForm] = useState({
    name: "",
    address: "",
    phone: "",
    avgPrice: "",
    type: "Hotel", // Default
    bookingLink: ""
  });

  // Admin Check
  const isAdmin = user?.role === "ADMIN" || user?.role === "admin" || user?.role?.toUpperCase() === "ADMIN";
  const [showEditForm, setShowEditForm] = useState(false);


  useEffect(() => {
    // Reset rating state when spot changes
    setUserRating(null);
    setRatingComment("");
    setHoveredRating(null);

    if (showDetails) {
      loadDetails();
    }
  }, [showDetails, spot.id]);

  // Debug: Log when userRating changes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log("userRating state changed:", userRating, "type:", typeof userRating);
    }
  }, [userRating]);

  const loadDetails = async () => {
    try {
      const [ratingsRes, commentsRes, photosRes, lodgingsRes] = await Promise.all([
        fetch(`/api/ratings/spot/${spot.id}`),
        fetch(`/api/comments/spot/${spot.id}`),
        fetch(`/api/photos/spot/${spot.id}`),
        fetch(`/api/lodgings/spot/${spot.id}`),
      ]);

      setRatings(await ratingsRes.json());
      setComments(await commentsRes.json());
      setPhotos(await photosRes.json());
      setLodgings(await lodgingsRes.json());

      // Load user's rating if authenticated
      if (token) {
        try {
          const myRatingRes = await fetch(`/api/ratings/spot/${spot.id}/my-rating`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (myRatingRes.ok) {
            const myRating = await myRatingRes.json();
            // Check if response is null (no rating) or an actual rating object
            if (myRating !== null && myRating !== undefined && myRating.score !== null && myRating.score !== undefined) {
              // Ensure score is a number
              const ratingScore = typeof myRating.score === 'number'
                ? myRating.score
                : parseInt(String(myRating.score), 10);
              console.log("Loading myRating:", ratingScore, typeof ratingScore);
              setUserRating(ratingScore);
              setRatingComment(myRating.summaryComment || "");
            } else {
              // No rating yet - only reset if we don't already have a rating set
              // (don't overwrite if we just set it from POST response)
              if (userRating === null) {
                setUserRating(null);
                setRatingComment("");
              }
            }
          } else if (myRatingRes.status === 401) {
            // Token expired or invalid - don't change state
            console.warn("Authentication failed when loading my-rating");
          }
        } catch (err) {
          // Silently fail if my-rating fails
          console.error("Error loading my rating:", err);
        }
      }
    } catch (error) {
      console.error("Error loading details:", error);
    }
  };

  const handleRate = async (score: number) => {
    if (!token) {
      alert("Please login to rate spots");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/ratings/spot/${spot.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ score, summaryComment: ratingComment || `Rated ${score} stars` }),
      });

      if (res.ok) {
        const ratingData = await res.json();
        // Use the response data directly - ensure score is a number
        const ratingScore = typeof ratingData.score === 'number'
          ? ratingData.score
          : parseInt(String(ratingData.score), 10);
        console.log("Setting userRating to:", ratingScore, typeof ratingScore);
        setUserRating(ratingScore);
        setRatingComment(ratingData.summaryComment || "");

        // Refresh the spots list to update average rating
        onUpdate();

        // Reload other details (ratings list, comments, etc.) but skip my-rating since we already have it
        try {
          const [ratingsRes, commentsRes, photosRes, lodgingsRes] = await Promise.all([
            fetch(`/api/ratings/spot/${spot.id}`),
            fetch(`/api/comments/spot/${spot.id}`),
            fetch(`/api/photos/spot/${spot.id}`),
            fetch(`/api/lodgings/spot/${spot.id}`),
          ]);

          setRatings(await ratingsRes.json());
          setComments(await commentsRes.json());
          setPhotos(await photosRes.json());
          setLodgings(await lodgingsRes.json());

          // Don't call my-rating - we already have the data from the POST response
        } catch (err) {
          console.error("Error reloading details:", err);
        }
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to save rating");
      }
    } catch (error) {
      console.error("Error rating:", error);
      alert("Failed to save rating");
    } finally {
      setLoading(false);
    }
  };

  const handleComment = async () => {
    if (!token) {
      alert("Please login to comment");
      return;
    }

    if (!commentText.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/comments/spot/${spot.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: commentText }),
      });

      if (res.ok) {
        setCommentText("");
        loadDetails();
      }
    } catch (error) {
      console.error("Error commenting:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setComments(comments.filter(c => c._id !== commentId));
      } else {
        alert("Failed to delete comment");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLodging = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/lodgings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          spotId: spot.id,
          ...lodgingForm,
          avgPrice: parseFloat(lodgingForm.avgPrice) || 0
        }),
      });

      if (res.ok) {
        const newLodging = await res.json();
        setLodgings([...lodgings, newLodging]);
        setShowLodgingForm(false);
        setLodgingForm({
          name: "",
          address: "",
          phone: "",
          avgPrice: "",
          type: "Hotel",
          bookingLink: ""
        });
      } else {
        const err = await res.json();
        alert(err.error || "Failed to add lodging");
      }
    } catch (error) {
      console.error("Error adding lodging:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!token) {
      alert("Please login to upload photos");
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type client-side
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("Invalid file type. Only JPEG, PNG, and WebP allowed");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      formData.append("title", file.name);

      const res = await fetch(`/api/photos/spot/${spot.id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        loadDetails();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to upload photo");
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
      alert("Failed to upload photo");
    } finally {
      setLoading(false);
      // Reset input
      e.target.value = "";
    }
  };

  return (
    <article
      style={{
        borderRadius: "0.75rem",
        border: "1px solid #e0e0e0",
        padding: "1rem",
        background: "radial-gradient(circle at top left, #f8fafc, #ffffff)",
        boxShadow: "0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.06)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <h3 style={{ margin: "0 0 0.25rem", fontSize: "1.1rem" }}>{spot.name}</h3>
        {token && onToggleFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(spot.id);
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "1.5rem",
              padding: "0 0.5rem",
              color: isFavorite ? "#e91e63" : "#ccc",
              transition: "transform 0.2s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "scale(1.2)";
              if (!isFavorite) e.currentTarget.style.color = "#f48fb1";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              if (!isFavorite) e.currentTarget.style.color = "#ccc";
            }}
            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            {isFavorite ? "♥" : "♡"}
          </button>
        )}
      </div>
      <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
        {spot.city}, {spot.state}, {spot.country}
      </p>
      <p style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#475569" }}>
        {spot.description}
      </p>
      <p style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "#0f172a" }}>
        <strong>Address:</strong> {spot.address}
      </p>
      <p style={{ marginTop: "0.25rem", fontSize: "0.85rem", color: "#0f172a" }}>
        <strong>Rating:</strong> {Number(spot.averageRating).toFixed(1)} / 5 ⭐
      </p>

      {/* Weather Display */}
      {(spot as any).weather && (
        <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "#64748b", fontSize: "0.9rem" }}>
          <img
            src={(spot as any).weather.icon}
            alt={(spot as any).weather.condition}
            style={{ width: "30px", height: "30px" }}
          />
          <span>
            {Math.round((spot as any).weather.temp)}°C, {(spot as any).weather.condition}
          </span>
        </div>
      )}


      <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button
          onClick={() => setShowDetails(!showDetails)}
          style={{
            flex: "1 1 auto", minWidth: "120px",
            padding: "0.5rem 1rem",
            backgroundColor: "#1976d2",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          {showDetails ? "Hide Details" : "View Details"}
        </button>
        <button
          onClick={async () => {
            try {
              const res = await fetch(`/api/directions/spot/${spot.id}`);
              const data = await res.json();
              if (data.googleMapsUrl) {
                window.open(data.googleMapsUrl, "_blank");
              }
            } catch (error) {
              console.error("Error fetching directions:", error);
            }
          }}
          style={{
            flex: "1 1 auto", minWidth: "120px",
            padding: "0.5rem 1rem",
            backgroundColor: "#4caf50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "0.9rem",
            cursor: "pointer",
          }}
        >
          Get Directions
        </button>

        {isAdmin && (
          <>
            <button
              onClick={() => setShowEditForm(!showEditForm)}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#ff9800",
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontSize: "0.9rem",
                cursor: "pointer",
              }}
            >
              {showEditForm ? "Cancel Edit" : "Edit"}
            </button>
            <button
              onClick={async () => {
                if (!confirm("Are you sure you want to delete this spot? This action cannot be undone.")) return;

                try {
                  const res = await fetch(`/api/spots/${spot.id}`, {
                    method: "DELETE",
                    headers: {
                      Authorization: `Bearer ${token}`
                    }
                  });

                  if (res.ok) {
                    onUpdate(); // Reload list
                  } else {
                    const err = await res.json();
                    alert(err.error || "Failed to delete spot");
                  }
                } catch (error) {
                  console.error("Error deleting spot:", error);
                  alert("Failed to delete spot");
                }
              }}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontSize: "0.9rem",
                cursor: "pointer",
              }}
            >
              Delete
            </button>
          </>
        )}
      </div>

      {showEditForm && (
        <div style={{ marginTop: "1rem" }}>
          <SpotForm
            token={token!}
            initialData={spot}
            onSuccess={() => {
              setShowEditForm(false);
              onUpdate();
            }}
            onCancel={() => setShowEditForm(false)}
          />
        </div>
      )}

      {showDetails && (
        <div style={{ marginTop: "1.5rem", borderTop: "1px solid #e0e0e0", paddingTop: "1rem" }}>
          {/* Rating Section */}
          {token && (
            <div style={{ marginBottom: "1.5rem" }}>
              <h4>Rate this spot:</h4>
              <div
                style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}
                onMouseLeave={() => setHoveredRating(null)}
              >
                {[1, 2, 3, 4, 5].map((star) => {
                  // Determine if star should be highlighted
                  // Use hoveredRating if hovering, otherwise use userRating
                  let displayRating: number | null = null;

                  if (hoveredRating !== null && hoveredRating !== undefined) {
                    displayRating = Number(hoveredRating);
                  } else if (userRating !== null && userRating !== undefined) {
                    displayRating = Number(userRating);
                  }

                  // Only highlight if we have a valid rating and this star is <= the rating
                  const isHighlighted = displayRating !== null &&
                    !isNaN(displayRating) &&
                    star <= displayRating;

                  // Debug: log first star only
                  if (star === 1 && process.env.NODE_ENV === 'development') {
                    console.log("Star rendering debug:", {
                      star,
                      userRating,
                      hoveredRating,
                      displayRating,
                      isHighlighted,
                      color: isHighlighted ? "#ffc107" : "#ccc"
                    });
                  }

                  return (
                    <button
                      key={star}
                      onClick={() => {
                        setHoveredRating(null); // Clear hover on click
                        handleRate(star);
                      }}
                      onMouseEnter={() => setHoveredRating(star)}
                      disabled={loading}
                      style={{
                        fontSize: "1.5rem",
                        background: "none",
                        border: "none",
                        cursor: loading ? "not-allowed" : "pointer",
                        color: isHighlighted ? "#ffc107" : "#ccc",
                        transition: "color 0.2s",
                        padding: "0.25rem",
                        filter: isHighlighted ? "drop-shadow(0 0 2px rgba(255, 193, 7, 0.5))" : "none",
                        WebkitTextFillColor: isHighlighted ? "#ffc107" : "#ccc",
                      }}
                      title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                    >
                      {isHighlighted ? '★' : '☆'}
                    </button>
                  );
                })}
              </div>
              {userRating !== null && userRating !== undefined && (
                <p style={{ margin: "0.5rem 0", fontSize: "0.9rem", color: "#666" }}>
                  You rated this {userRating} star{Number(userRating) > 1 ? 's' : ''}
                </p>
              )}
              {/* Debug: Remove this in production
              {process.env.NODE_ENV === 'development' && (
                <p style={{ margin: "0.25rem 0", fontSize: "0.75rem", color: "#999" }}>
                  Debug: userRating={String(userRating)}, type={typeof userRating}, hovered={String(hoveredRating)}
                </p>
              )} */}
              <input
                type="text"
                placeholder="Add a comment about your rating..."
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                style={{ width: "100%", padding: "0.5rem", fontSize: "0.9rem", marginTop: "0.5rem", boxSizing: "border-box" }}
              />
            </div>
          )}

          {/* Comments Section */}
          <div style={{ marginBottom: "1.5rem" }}>
            <h4>Comments ({comments.length})</h4>
            {token && (
              <div style={{ marginBottom: "1rem" }}>
                <textarea
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  style={{ width: "100%", padding: "0.5rem", fontSize: "0.9rem", minHeight: "60px", boxSizing: "border-box" }}
                />
                <button
                  onClick={handleComment}
                  disabled={loading || !commentText.trim()}
                  style={{
                    marginTop: "0.5rem",
                    padding: "0.5rem 1rem",
                    backgroundColor: "#1976d2",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  Post Comment
                </button>
              </div>
            )}
            <div style={{ maxHeight: "200px", overflowY: "auto" }}>
              {comments.map((comment: any) => (
                <div key={comment._id} style={{ marginBottom: "0.5rem", padding: "0.5rem", background: "#f5f5f5", borderRadius: "4px" }}>
                  <p style={{ margin: 0, fontSize: "0.9rem" }}>{comment.text}</p>
                  <small style={{ color: "#666" }}>
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </small>
                  {/* Delete Comment Button */}
                  {token && (
                    <button
                      onClick={() => handleDeleteComment(comment._id)}
                      style={{
                        marginLeft: "1rem",
                        color: "#ef4444",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "0.8rem",
                        textDecoration: "underline"
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Photos Section */}
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <h4>Photos ({photos.length})</h4>
              {token && (
                <div style={{ display: "flex", alignItems: "center" }}>
                  <label
                    htmlFor={`photo-upload-${spot.id}`}
                    style={{
                      cursor: "pointer",
                      padding: "0.25rem 0.75rem",
                      backgroundColor: "#e2e8f0",
                      borderRadius: "4px",
                      fontSize: "0.85rem",
                      marginRight: "0.5rem"
                    }}
                  >
                    + Add Photo
                  </label>
                  <input
                    id={`photo-upload-${spot.id}`}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoUpload}
                    style={{ display: "none" }}
                    disabled={loading}
                  />
                </div>
              )}
            </div>

            {photos.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "0.5rem" }}>
                {photos.map((photo: any) => (
                  <div key={photo._id || photo.id} style={{ aspectRatio: "1", background: "#f0f0f0", borderRadius: "4px", overflow: "hidden", position: "relative" }}>
                    {photo.filename ? (
                      <a href={`/uploads/${photo.filename}`} target="_blank" rel="noopener noreferrer">
                        <img
                          src={`/uploads/${photo.filename}`}
                          alt={photo.title || "Spot photo"}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          onError={(e) => {
                            // Fallback if image fails to load
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.innerText = 'Image not found';
                          }}
                        />
                      </a>
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: "0.8rem", color: "#666" }}>📷 {photo.title}</span>
                      </div>
                    )}
                    {token && (
                      <button
                        onClick={async () => {
                          if (!confirm("Delete this photo?")) return;

                          try {
                            const res = await fetch(`/api/photos/${photo._id || photo.id}`, {
                              method: "DELETE",
                              headers: {
                                Authorization: `Bearer ${token}`
                              }
                            });

                            if (res.ok) {
                              setPhotos(photos.filter(p => (p._id || p.id) !== (photo._id || photo.id)));
                            } else {
                              const err = await res.json();
                              alert(err.error || "Failed to delete photo");
                            }
                          } catch (error) {
                            console.error("Error deleting photo:", error);
                            alert("Failed to delete photo");
                          }
                        }}
                        style={{
                          position: "absolute",
                          top: "2px",
                          right: "2px",
                          background: "rgba(255, 255, 255, 0.9)",
                          color: "red",
                          border: "none",
                          borderRadius: "50%",
                          width: "20px",
                          height: "20px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          fontWeight: "bold",
                          zIndex: 10
                        }}
                        title="Delete photo"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "#666", fontStyle: "italic", fontSize: "0.9rem" }}>No photos yet.</p>
            )}
          </div>

          {/* Lodgings Section */}
          <div style={{ paddingBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <h4>Nearby Lodgings ({lodgings.length})</h4>
              {token && (
                <button
                  onClick={() => setShowLodgingForm(!showLodgingForm)}
                  style={{
                    padding: "0.25rem 0.75rem",
                    backgroundColor: "#e2e8f0",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                  }}
                >
                  {showLodgingForm ? "Cancel" : "+ Add Lodging"}
                </button>
              )}
            </div>

            {showLodgingForm && (
              <form onSubmit={handleAddLodging} style={{ marginBottom: "1rem", padding: "1rem", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <input
                    placeholder="Name"
                    value={lodgingForm.name}
                    onChange={e => setLodgingForm({ ...lodgingForm, name: e.target.value })}
                    required
                    style={{ padding: "0.5rem", flex: "1 1 200px" }}
                  />
                  <select
                    value={lodgingForm.type}
                    onChange={e => setLodgingForm({ ...lodgingForm, type: e.target.value })}
                    style={{ padding: "0.5rem", flex: "1 1 150px" }}
                  >
                    <option value="Hotel">Hotel</option>
                    <option value="Hostel">Hostel</option>
                    <option value="Inn">Inn</option>
                    <option value="Resort">Resort</option>
                  </select>
                  <input
                    placeholder="Address"
                    value={lodgingForm.address}
                    onChange={e => setLodgingForm({ ...lodgingForm, address: e.target.value })}
                    required
                    style={{ padding: "0.5rem", flex: "1 1 200px" }}
                  />
                  <input
                    placeholder="Phone (min 5 chars)"
                    value={lodgingForm.phone}
                    onChange={e => setLodgingForm({ ...lodgingForm, phone: e.target.value })}
                    required
                    style={{ padding: "0.5rem", flex: "1 1 150px" }}
                  />
                  <input
                    placeholder="Avg Price (e.g. 100.00)"
                    value={lodgingForm.avgPrice}
                    onChange={e => setLodgingForm({ ...lodgingForm, avgPrice: e.target.value })}
                    style={{ padding: "0.5rem", flex: "1 1 150px" }}
                  />
                  <input
                    placeholder="Booking Link"
                    value={lodgingForm.bookingLink}
                    onChange={e => setLodgingForm({ ...lodgingForm, bookingLink: e.target.value })}
                    style={{ padding: "0.5rem", flex: "1 1 200px" }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#166534",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: loading ? "not-allowed" : "pointer"
                  }}
                >
                  Save Lodging
                </button>
              </form>
            )}

            {lodgings.length > 0 && (
              <div>
                {lodgings.map((lodging: any) => (
                  <div key={lodging.id} style={{ marginBottom: "0.5rem", padding: "0.5rem", background: "#f5f5f5", borderRadius: "4px", position: "relative" }}>
                    <strong>{lodging.name}</strong> - {lodging.type}
                    <br />
                    <small>{lodging.address}</small>
                    <br />
                    <small>Avg. Price: ${lodging.avgPrice}</small>
                    {lodging.bookingLink && (
                      <a href={lodging.bookingLink} target="_blank" rel="noopener noreferrer" style={{ marginLeft: "0.5rem", fontSize: "0.8rem" }}>
                        Book Now
                      </a>
                    )}
                    {token && (
                      <button
                        onClick={async () => {
                          if (!confirm("Delete this lodging?")) return;

                          try {
                            const res = await fetch(`/api/lodgings/${lodging.id}`, {
                              method: "DELETE",
                              headers: {
                                Authorization: `Bearer ${token}`
                              }
                            });

                            if (res.ok) {
                              setLodgings(lodgings.filter(l => l.id !== lodging.id));
                            } else {
                              const err = await res.json();
                              alert(err.error || "Failed to delete lodging");
                            }
                          } catch (error) {
                            console.error("Error deleting lodging:", error);
                            alert("Failed to delete lodging");
                          }
                        }}
                        style={{
                          position: "absolute",
                          top: "5px",
                          right: "5px",
                          background: "none",
                          color: "#dc3545",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "1.2rem",
                          fontWeight: "bold",
                        }}
                        title="Delete lodging"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </article>
  );
};