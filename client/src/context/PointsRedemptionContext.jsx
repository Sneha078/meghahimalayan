import {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";

const PointsRedemptionContext = createContext();

const POINTS_REDEMPTION_KEY = "cart_points_redemption";

/**
 * Load points redemption from localStorage
 */
function loadPointsRedemption() {
  try {
    const raw = localStorage.getItem(POINTS_REDEMPTION_KEY);

    if (!raw) {
      return {
        pointsUsed: 0,
        pointsDiscount: 0,
      };
    }

    const parsed = JSON.parse(raw);

    return {
      pointsUsed: Number(parsed.pointsUsed) || 0,
      pointsDiscount: Number(parsed.pointsDiscount) || 0,
    };
  } catch {
    return {
      pointsUsed: 0,
      pointsDiscount: 0,
    };
  }
}

/**
 * Save points redemption to localStorage
 */
function savePointsRedemption(pointsUsed, pointsDiscount) {
  localStorage.setItem(
    POINTS_REDEMPTION_KEY,
    JSON.stringify({
      pointsUsed: Number(pointsUsed) || 0,
      pointsDiscount: Number(pointsDiscount) || 0,
    })
  );
}

/**
 * Remove points redemption from localStorage
 */
function removeSavedPointsRedemption() {
  localStorage.removeItem(POINTS_REDEMPTION_KEY);
}

export function PointsRedemptionProvider({ children }) {
  const savedPoints = loadPointsRedemption();

  const [pointsUsed, setPointsUsedState] = useState(savedPoints.pointsUsed);
  const [pointsDiscount, setPointsDiscountState] = useState(savedPoints.pointsDiscount);

  /**
   * Update points redemption and persist to localStorage
   */
  const setPointsRedemption = useCallback((points, pointsDisc) => {
    const safePoints = Number(points) || 0;
    const safeDiscount = Number(pointsDisc) || 0;

    setPointsUsedState(safePoints);
    setPointsDiscountState(safeDiscount);

    savePointsRedemption(safePoints, safeDiscount);
  }, []);

  /**
   * Clear points redemption
   */
  const clearPointsRedemption = useCallback(() => {
    setPointsUsedState(0);
    setPointsDiscountState(0);
    removeSavedPointsRedemption();
  }, []);

  return (
    <PointsRedemptionContext.Provider
      value={{
        pointsUsed,
        pointsDiscount,
        setPointsRedemption,
        clearPointsRedemption,
      }}
    >
      {children}
    </PointsRedemptionContext.Provider>
  );
}

export function usePointsRedemption() {
  const context = useContext(PointsRedemptionContext);
  if (!context) {
    throw new Error('usePointsRedemption must be used within a PointsRedemptionProvider');
  }
  return context;
}