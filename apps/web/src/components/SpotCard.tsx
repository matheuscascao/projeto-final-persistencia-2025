import React, { useState, useEffect } from "react";
import type { TouristSpot } from "@tourism/shared";

interface SpotCardProps {
  spot: TouristSpot;
  token: string | null;
  onUpdate: () => void;
}

export const SpotCard: React.FC<SpotCardProps> = ({ spot, token, onUpdate }) => {
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
      <h3 style={{ margin: "0 0 0.25rem", fontSize: "1.1rem" }}>{spot.name}</h3>
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

      <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button
          onClick={() => setShowDetails(!showDetails)}
          style={{
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
      </div>

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
              {/* Debug: Remove this in production */}
              {process.env.NODE_ENV === 'development' && (
                <p style={{ margin: "0.25rem 0", fontSize: "0.75rem", color: "#999" }}>
                  Debug: userRating={String(userRating)}, type={typeof userRating}, hovered={String(hoveredRating)}
                </p>
              )}
              <input
                type="text"
                placeholder="Add a comment about your rating..."
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                style={{ width: "100%", padding: "0.5rem", fontSize: "0.9rem", marginTop: "0.5rem" }}
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
                  style={{ width: "100%", padding: "0.5rem", fontSize: "0.9rem", minHeight: "60px" }}
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
                </div>
              ))}
            </div>
          </div>

          {/* Photos Section */}
          {photos.length > 0 && (
            <div style={{ marginBottom: "1.5rem" }}>
              <h4>Photos ({photos.length})</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "0.5rem" }}>
                {photos.map((photo: any) => (
                  <div key={photo._id} style={{ aspectRatio: "1", background: "#f0f0f0", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: "0.8rem", color: "#666" }}>📷 {photo.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lodgings Section */}
          {lodgings.length > 0 && (
            <div>
              <h4>Nearby Lodgings ({lodgings.length})</h4>
              {lodgings.map((lodging: any) => (
                <div key={lodging.id} style={{ marginBottom: "0.5rem", padding: "0.5rem", background: "#f5f5f5", borderRadius: "4px" }}>
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
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
};

