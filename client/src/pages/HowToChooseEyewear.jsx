import { useState } from "react";
import PageBanner from "../components/PageBanner";

const STEPS = [
  {
    number: "01",
    title: "Consider Your Face Shape",
    detail:
      "Your face shape plays a vital role in choosing the perfect eyewear. Oval faces suit most frames, round faces look great in rectangular frames, square faces soften with round or oval frames, and heart-shaped faces balance well with bottom-heavy or cat-eye frames.",
  },
  {
    number: "02",
    title: "Pick a Material",
    detail:
      "Choose a material that fits your lifestyle. Acetate is lightweight and vibrant, metal is sleek and durable, titanium is premium and hypoallergenic, and TR-90 is flexible and sporty. Consider comfort for all-day wear.",
  },
  {
    number: "03",
    title: "Decide on a Color",
    detail:
      "A matching color with your skin tone plays an important role in selecting an eyewear. Warm skin tones suit earthy tones like brown, gold, and olive. Cool skin tones shine in black, silver, and blue. Or simply choose your favourite color.",
  },
  {
    number: "04",
    title: "Choose the Correct Size",
    detail:
      "Pick the correct size frame for your face. Frames that are too small cause discomfort, while oversized frames can slide down. The bridge should sit flush on your nose, and the temples should not press against your ears.",
  },
];

const FACE_SHAPES = [
  {
    id: "oval",
    name: "Oval",
    description:
      "Balanced proportions with a slightly narrower chin. The most versatile face shape - almost any frame works.",
    recommended: [
      "Wayfarer",
      "Round",
      "Square",
      "Rectangle",
      "Cat Eye",
      "Aviator",
      "Geometric",
      "Oval",
    ],
    avoid: [],
    svg: (
      <ellipse cx="50" cy="50" rx="32" ry="40" fill="none" stroke="currentColor" strokeWidth="2" />
    ),
  },
  {
    id: "round",
    name: "Round",
    description:
      "Equal width and length with soft curves. Angular frames add definition and make the face appear longer.",
    recommended: [
      "Rectangle",
      "Square",
      "Wayfarer",
      "Geometric",
      "Aviator",
    ],
    avoid: ["Round", "Oval"],
    svg: (
      <circle cx="50" cy="50" r="36" fill="none" stroke="currentColor" strokeWidth="2" />
    ),
  },
  {
    id: "square",
    name: "Square",
    description:
      "Strong jawline with equal width and length. Curved and round frames soften angular features.",
    recommended: ["Round", "Oval", "Cat Eye", "Aviator", "Wayfarer"],
    avoid: ["Square", "Rectangle"],
    svg: (
      <rect x="16" y="16" width="68" height="68" rx="8" fill="none" stroke="currentColor" strokeWidth="2" />
    ),
  },
  {
    id: "heart",
    name: "Heart",
    description:
      "Wider forehead with a narrow chin. Bottom-heavy frames balance the proportions beautifully.",
    recommended: ["Cat Eye", "Oval", "Round", "Wayfarer", "Aviator"],
    avoid: ["Geometric"],
    svg: (
      <path
        d="M50 88 C20 65 12 45 20 28 C28 10 45 12 50 28 C55 12 72 10 80 28 C88 45 80 65 50 88Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    ),
  },
  {
    id: "oblong",
    name: "Oblong",
    description:
      "Longer than it is wide with a similar width throughout. Decorative or oversized frames add width.",
    recommended: ["Square", "Round", "Cat Eye", "Wayfarer", "Geometric"],
    avoid: ["Rectangle", "Oval"],
    svg: (
      <ellipse cx="50" cy="50" rx="28" ry="44" fill="none" stroke="currentColor" strokeWidth="2" />
    ),
  },
  {
    id: "diamond",
    name: "Diamond",
    description:
      "Narrow forehead and chin with wide cheekbones. Cat-eye and oval frames highlight the eyes.",
    recommended: ["Cat Eye", "Oval", "Round", "Wayfarer", "Rectangle"],
    avoid: ["Geometric", "Square"],
    svg: (
      <path
        d="M50 8 L88 50 L50 92 L12 50 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    ),
  },
];

const FRAME_SHAPES = [
  {
    name: "Wayfarer",
    description: "Classic trapezoidal shape - timeless and universally flattering.",
    svg: (
      <g>
        <rect x="5" y="30" width="35" height="24" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
        <rect x="60" y="30" width="35" height="24" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M40 40 Q50 35 60 40" fill="none" stroke="currentColor" strokeWidth="2" />
        <line x1="5" y1="40" x2="2" y2="35" stroke="currentColor" strokeWidth="2" />
        <line x1="95" y1="40" x2="98" y2="35" stroke="currentColor" strokeWidth="2" />
      </g>
    ),
  },
  {
    name: "Round",
    description: "Perfectly circular lenses - retro, intellectual, and softens angular faces.",
    svg: (
      <g>
        <circle cx="25" cy="45" r="17" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="75" cy="45" r="17" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M42 45 Q50 40 58 45" fill="none" stroke="currentColor" strokeWidth="2" />
        <line x1="8" y1="45" x2="3" y2="40" stroke="currentColor" strokeWidth="2" />
        <line x1="92" y1="45" x2="97" y2="40" stroke="currentColor" strokeWidth="2" />
      </g>
    ),
  },
  {
    name: "Square",
    description: "Bold angular frames - adds structure and definition to soft features.",
    svg: (
      <g>
        <rect x="5" y="30" width="35" height="28" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
        <rect x="60" y="30" width="35" height="28" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M40 42 Q50 38 60 42" fill="none" stroke="currentColor" strokeWidth="2" />
        <line x1="5" y1="40" x2="2" y2="35" stroke="currentColor" strokeWidth="2" />
        <line x1="95" y1="40" x2="98" y2="35" stroke="currentColor" strokeWidth="2" />
      </g>
    ),
  },
  {
    name: "Rectangle",
    description: "Wider than tall with clean lines - professional and slimming.",
    svg: (
      <g>
        <rect x="5" y="32" width="35" height="22" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
        <rect x="60" y="32" width="35" height="22" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M40 42 Q50 39 60 42" fill="none" stroke="currentColor" strokeWidth="2" />
        <line x1="5" y1="40" x2="2" y2="36" stroke="currentColor" strokeWidth="2" />
        <line x1="95" y1="40" x2="98" y2="36" stroke="currentColor" strokeWidth="2" />
      </g>
    ),
  },
  {
    name: "Oval",
    description: "Elongated rounded lenses - elegant and complements most face shapes.",
    svg: (
      <g>
        <ellipse cx="25" cy="45" rx="18" ry="14" fill="none" stroke="currentColor" strokeWidth="2" />
        <ellipse cx="75" cy="45" rx="18" ry="14" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M43 45 Q50 41 57 45" fill="none" stroke="currentColor" strokeWidth="2" />
        <line x1="7" y1="45" x2="3" y2="41" stroke="currentColor" strokeWidth="2" />
        <line x1="93" y1="45" x2="97" y2="41" stroke="currentColor" strokeWidth="2" />
      </g>
    ),
  },
  {
    name: "Cat Eye",
    description: "Upswept outer corners - feminine, flattering, and lifts the face.",
    svg: (
      <g>
        <path d="M5 50 Q5 30 30 32 Q42 34 40 50 Q38 56 20 56 Q8 56 5 50Z" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M95 50 Q95 30 70 32 Q58 34 60 50 Q62 56 80 56 Q92 56 95 50Z" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M40 44 Q50 40 60 44" fill="none" stroke="currentColor" strokeWidth="2" />
      </g>
    ),
  },
  {
    name: "Aviator",
    description: "Teardrop-shaped lenses with a double bridge - iconic and adventurous.",
    svg: (
      <g>
        <path d="M8 38 Q8 30 25 30 Q42 30 42 42 Q42 58 25 58 Q8 58 8 42Z" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M92 38 Q92 30 75 30 Q58 30 58 42 Q58 58 75 58 Q92 58 92 42Z" fill="none" stroke="currentColor" strokeWidth="2" />
        <line x1="42" y1="36" x2="58" y2="36" stroke="currentColor" strokeWidth="2" />
        <line x1="42" y1="40" x2="58" y2="40" stroke="currentColor" strokeWidth="2" />
        <line x1="8" y1="40" x2="3" y2="36" stroke="currentColor" strokeWidth="2" />
        <line x1="92" y1="40" x2="97" y2="36" stroke="currentColor" strokeWidth="2" />
      </g>
    ),
  },
  {
    name: "Geometric",
    description: "Angular hexagonal or octagonal shapes - bold, modern, and fashion-forward.",
    svg: (
      <g>
        <polygon points="5,40 15,30 35,30 42,40 35,55 15,55" fill="none" stroke="currentColor" strokeWidth="2" />
        <polygon points="95,40 85,30 65,30 58,40 65,55 85,55" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M42 40 Q50 37 58 40" fill="none" stroke="currentColor" strokeWidth="2" />
        <line x1="5" y1="40" x2="2" y2="36" stroke="currentColor" strokeWidth="2" />
        <line x1="95" y1="40" x2="98" y2="36" stroke="currentColor" strokeWidth="2" />
      </g>
    ),
  },
];

function FaceShapeIcon({ svg, size = 70 }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      {svg}
    </svg>
  );
}

function FrameShapeIcon({ svg, size = 80 }) {
  return (
    <svg viewBox="0 0 100 80" width={size} height={size * 0.8} aria-hidden="true">
      {svg}
    </svg>
  );
}

function HowToChooseEyewear() {
  const [selectedFace, setSelectedFace] = useState(null);

  const activeFace = selectedFace
    ? FACE_SHAPES.find((f) => f.id === selectedFace)
    : null;

  return (
    <div style={{ backgroundColor: "var(--color-sbg)", minHeight: "100vh" }}>
      <PageBanner
        eyebrow="Buying Guide"
        title="How to Choose a Perfect Eyewear?"
      />

      <div
        style={{
          padding: "clamp(20px, 4vw, 40px) var(--section-px)",
          maxWidth: "900px",
        }}
      >
        <p
          style={{
            color: "var(--color-muted)",
            fontSize: "0.92rem",
            lineHeight: "1.7",
            marginBottom: "32px",
          }}
        >
          Finding the right eyewear is more than just picking a frame you like.
          Follow these four steps to find a pair that suits your face, style,
          and vision needs.
        </p>

        {/* ── Step 01 - Face Shape Chart ── */}
        <div
          style={{
            backgroundColor: "var(--color-white)",
            borderRadius: "12px",
            border: "1px solid var(--color-border)",
            padding: "clamp(16px, 4vw, 24px)",
            display: "flex",
            gap: "12px",
            alignItems: "flex-start",
            marginBottom: "16px",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "1.4rem",
              fontWeight: "800",
              color: "var(--color-taupe)",
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            01
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              style={{
                fontSize: "0.95rem",
                fontWeight: "700",
                color: "var(--color-navy)",
                marginBottom: "6px",
              }}
            >
              {STEPS[0].title}
            </h3>
            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--color-muted)",
                lineHeight: "1.6",
              }}
            >
              {STEPS[0].detail}
            </p>

            {/* Face Shape Selector */}
            <p
              style={{
                fontSize: "0.75rem",
                fontWeight: "700",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--color-taupe)",
                margin: "20px 0 12px",
              }}
            >
              Tap your face shape
            </p>
            <div
              className="grid grid-cols-3 sm:grid-cols-6"
              style={{ gap: "8px", marginBottom: "16px" }}
            >
              {FACE_SHAPES.map((face) => (
                <button
                  key={face.id}
                  type="button"
                  onClick={() =>
                    setSelectedFace(selectedFace === face.id ? null : face.id)
                  }
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "6px",
                    padding: "12px 4px 8px",
                    borderRadius: "10px",
                    border:
                      selectedFace === face.id
                        ? "2px solid var(--color-navy)"
                        : "1px solid var(--color-border)",
                    backgroundColor:
                      selectedFace === face.id ? "#f0ebe3" : "transparent",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    color: "var(--color-navy)",
                    minHeight: "80px",
                  }}
                >
                  <FaceShapeIcon svg={face.svg} size={44} />
                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight:
                        selectedFace === face.id ? "700" : "500",
                    }}
                  >
                    {face.name}
                  </span>
                </button>
              ))}
            </div>

            {/* Selected Face Detail */}
            {activeFace && (
              <div
                style={{
                  backgroundColor: "#f0ebe3",
                  borderRadius: "10px",
                  padding: "clamp(12px, 3vw, 16px)",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    marginBottom: "10px",
                  }}
                >
                  <div style={{ flexShrink: 0 }}>
                    <FaceShapeIcon svg={activeFace.svg} size={44} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h4
                      style={{
                        fontSize: "0.9rem",
                        fontWeight: "700",
                        color: "var(--color-navy)",
                        marginBottom: "4px",
                      }}
                    >
                      {activeFace.name} Face
                    </h4>
                    <p
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--color-muted)",
                        lineHeight: "1.5",
                      }}
                    >
                      {activeFace.description}
                    </p>
                  </div>
                </div>

                <p
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    color: "var(--color-navy)",
                    marginBottom: "8px",
                  }}
                >
                  Recommended frames:
                </p>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "6px",
                    marginBottom: "10px",
                  }}
                >
                  {activeFace.recommended.map((name) => {
                    const frame = FRAME_SHAPES.find(
                      (f) => f.name === name
                    );
                    return (
                      <span
                        key={name}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "4px 10px",
                          borderRadius: "20px",
                          backgroundColor: "var(--color-navy)",
                          color: "#fff",
                          fontSize: "0.72rem",
                          fontWeight: "600",
                        }}
                      >
                        {frame && (
                          <FrameShapeIcon svg={frame.svg} size={22} />
                        )}
                        {name}
                      </span>
                    );
                  })}
                </div>

                {activeFace.avoid.length > 0 && (
                  <>
                    <p
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: "700",
                        color: "#dc2626",
                        marginBottom: "6px",
                      }}
                    >
                      Avoid:
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {activeFace.avoid.map((name) => (
                        <span
                          key={name}
                          style={{
                            padding: "4px 10px",
                            borderRadius: "20px",
                            backgroundColor: "#fef2f2",
                            border: "1px solid #fecaca",
                            color: "#dc2626",
                            fontSize: "0.72rem",
                            fontWeight: "600",
                          }}
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Frame Shape Reference ── */}
        <div
          style={{
            backgroundColor: "var(--color-white)",
            borderRadius: "12px",
            border: "1px solid var(--color-border)",
            padding: "clamp(16px, 4vw, 24px)",
            marginBottom: "16px",
          }}
        >
          <h3
            style={{
              fontSize: "0.95rem",
              fontWeight: "700",
              color: "var(--color-navy)",
              marginBottom: "4px",
            }}
          >
            Frame Shape Reference
          </h3>
          <p
            style={{
              fontSize: "0.82rem",
              color: "var(--color-muted)",
              marginBottom: "16px",
            }}
          >
            All frame shapes available at Mega Himalaya. Tap a face shape above
            to see which ones suit you.
          </p>
          <div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
            style={{ gap: "10px" }}
          >
            {FRAME_SHAPES.map((frame) => (
              <div
                key={frame.name}
                style={{
                  border: "1px solid var(--color-border)",
                  borderRadius: "10px",
                  padding: "14px 8px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "6px",
                  textAlign: "center",
                  color: "var(--color-navy)",
                }}
              >
                <FrameShapeIcon svg={frame.svg} size={64} />
                <span
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: "700",
                  }}
                >
                  {frame.name}
                </span>
                <span
                  style={{
                    fontSize: "0.68rem",
                    color: "var(--color-muted)",
                    lineHeight: "1.4",
                  }}
                >
                  {frame.description}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Compatibility Matrix ── */}
        <div
          style={{
            backgroundColor: "var(--color-white)",
            borderRadius: "12px",
            border: "1px solid var(--color-border)",
            padding: "clamp(16px, 4vw, 24px)",
            marginBottom: "16px",
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <h3
            style={{
              fontSize: "0.95rem",
              fontWeight: "700",
              color: "var(--color-navy)",
              marginBottom: "4px",
            }}
          >
            Face Shape & Frame Compatibility
          </h3>
          <p
            style={{
              fontSize: "0.82rem",
              color: "var(--color-muted)",
              marginBottom: "8px",
            }}
          >
            A quick reference for which frame shapes work best with each face
            shape.
          </p>
          <p
            className="sm:hidden"
            style={{
              fontSize: "0.7rem",
              color: "var(--color-taupe)",
              marginBottom: "8px",
              fontStyle: "italic",
            }}
          >
            ← Scroll sideways to see all frame shapes →
          </p>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.8rem",
              minWidth: "600px",
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: "left",
                    padding: "10px 8px",
                    fontSize: "0.7rem",
                    fontWeight: "700",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "var(--color-taupe)",
                    borderBottom: "2px solid var(--color-border)",
                  }}
                >
                  Face Shape
                </th>
                {FRAME_SHAPES.map((frame) => (
                  <th
                    key={frame.name}
                    style={{
                      textAlign: "center",
                      padding: "10px 4px",
                      fontSize: "0.65rem",
                      fontWeight: "700",
                      color: "var(--color-navy)",
                      borderBottom: "2px solid var(--color-border)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <FrameShapeIcon svg={frame.svg} size={32} />
                      {frame.name}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACE_SHAPES.map((face) => (
                <tr key={face.id}>
                  <td
                    style={{
                      padding: "10px 8px",
                      borderBottom: "1px solid var(--color-border)",
                      fontWeight: "600",
                      color: "var(--color-navy)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <FaceShapeIcon svg={face.svg} size={28} />
                      {face.name}
                    </div>
                  </td>
                  {FRAME_SHAPES.map((frame) => {
                    const isRecommended = face.recommended.includes(
                      frame.name
                    );
                    const isAvoid = face.avoid.includes(frame.name);
                    return (
                      <td
                        key={frame.name}
                        style={{
                          textAlign: "center",
                          padding: "10px 4px",
                          borderBottom: "1px solid var(--color-border)",
                        }}
                      >
                        {isRecommended ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "24px",
                              height: "24px",
                              borderRadius: "50%",
                              backgroundColor: "#dcfce7",
                              color: "#16a34a",
                              fontWeight: "700",
                              fontSize: "0.8rem",
                            }}
                          >
                            ✓
                          </span>
                        ) : isAvoid ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "24px",
                              height: "24px",
                              borderRadius: "50%",
                              backgroundColor: "#fef2f2",
                              color: "#dc2626",
                              fontWeight: "700",
                              fontSize: "0.8rem",
                            }}
                          >
                            ✕
                          </span>
                        ) : (
                          <span
                            style={{
                              display: "inline-block",
                              width: "24px",
                              height: "24px",
                              lineHeight: "24px",
                              color: "#d1d5db",
                            }}
                          >
                            ·
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Steps 02–05 ── */}
        {STEPS.slice(1).map((step) => (
          <div
            key={step.number}
            style={{
              backgroundColor: "var(--color-white)",
              borderRadius: "12px",
              border: "1px solid var(--color-border)",
              padding: "clamp(16px, 4vw, 24px)",
              display: "flex",
              gap: "12px",
              alignItems: "flex-start",
              marginBottom: "16px",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "1.4rem",
                fontWeight: "800",
                color: "var(--color-taupe)",
                lineHeight: 1,
                flexShrink: 0,
              }}
            >
              {step.number}
            </span>
            <div>
              <h3
                style={{
                  fontSize: "0.95rem",
                  fontWeight: "700",
                  color: "var(--color-navy)",
                  marginBottom: "6px",
                }}
              >
                {step.title}
              </h3>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "var(--color-muted)",
                  lineHeight: "1.6",
                }}
              >
                {step.detail}
              </p>
            </div>
          </div>
        ))}

        <div
          style={{
            marginTop: "16px",
            padding: "clamp(20px, 4vw, 24px)",
            borderRadius: "12px",
            backgroundColor: "var(--color-navy)",
            textAlign: "center",
          }}
        >
          <p
            style={{
              color: "#ffffff",
              fontSize: "0.95rem",
              fontWeight: "600",
              marginBottom: "12px",
            }}
          >
            Still not sure which frame suits you?
          </p>
          <a
            href="/shop?category=eyeglasses"
            style={{
              display: "inline-block",
              padding: "10px 28px",
              borderRadius: "8px",
              backgroundColor: "var(--color-taupe)",
              color: "var(--color-navy)",
              fontSize: "0.85rem",
              fontWeight: "700",
              textDecoration: "none",
            }}
          >
            Browse Eyeglasses →
          </a>
        </div>
      </div>
    </div>
  );
}

export default HowToChooseEyewear;
