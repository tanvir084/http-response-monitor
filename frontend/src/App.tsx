/**
 * Main Application Component
 *
 * Root component that manages HTTP response monitoring state,
 * handles real-time WebSocket updates, and coordinates data fetching.
 */

import { useState, useEffect } from "react";
import { ResponseTable } from "./components/ResponseTable";
import { Statistics } from "./components/Statistics";
import { useWebSocket } from "./hooks/useWebSocket";
import { useApi } from "./hooks/useApi";
import type { HttpResponse, Statistics as StatisticsType } from "./types";
import "./App.css";

function App() {
  const [responses, setResponses] = useState<HttpResponse[]>([]);
  const [statistics, setStatistics] = useState<StatisticsType | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isTriggeringPing, setIsTriggeringPing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { fetchResponses, fetchStatistics, triggerManualPing } = useApi();

  // WebSocket: prepend new responses and refresh statistics
  useWebSocket((newResponse: HttpResponse) => {
    setResponses((prev) => [newResponse, ...prev]);
    loadStatistics();
  });

  const loadResponses = async (pageNumber: number): Promise<void> => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const responseData = await fetchResponses(pageNumber, 20);
      setResponses(responseData.data);
      setTotalPages(responseData.pagination.totalPages);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load responses";
      setErrorMessage(message);
      console.error("Error loading responses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStatistics = async (): Promise<void> => {
    try {
      const statsData = await fetchStatistics();
      setStatistics(statsData);
    } catch (error) {
      console.error("Error loading statistics:", error);
    }
  };

  const handleManualPing = async (): Promise<void> => {
    try {
      setIsTriggeringPing(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const result = await triggerManualPing();

      if (result.statusCode >= 200 && result.statusCode < 300) {
        setSuccessMessage(`✅ Ping successful! Status: ${result.statusCode}`);
      } else if (result.statusCode === 0) {
        setErrorMessage(
          `❌ Unable to reach httpbin.org. The external service may be down.`
        );
      } else if (result.statusCode >= 400) {
        const errorDetail = result.error || "Error occurred";
        setErrorMessage(
          `⚠️ Request failed! httpbin.org returned status ${result.statusCode}: ${errorDetail}`
        );
      }

      // Auto-clear messages after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
        setErrorMessage(null);
      }, 3000);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to trigger ping";
      setErrorMessage(message);
    } finally {
      setIsTriggeringPing(false);
    }
  };

  const handleRefresh = async (): Promise<void> => {
    try {
      setIsRefreshing(true);
      setErrorMessage(null);

      await loadResponses(currentPage);
      await loadStatistics();

      setSuccessMessage("✅ Data refreshed successfully!");
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to refresh data";
      setErrorMessage(message);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handlePageChange = (newPage: number): void => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  useEffect(() => {
    loadResponses(currentPage);
    loadStatistics();
  }, [currentPage]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>HTTP Response Monitor</h1>
        <p className="subtitle">Real-time monitoring of httpbin.org/anything</p>
      </header>

      {errorMessage && (
        <div className="error-banner">
          {errorMessage.includes("⚠️") || errorMessage.includes("❌")
            ? ""
            : "⚠️ "}
          {errorMessage}
          {errorMessage.includes("Backend may be down") && (
            <>
              <br />
              <small>
                Make sure the backend is running on http://localhost:3001
              </small>
            </>
          )}
        </div>
      )}

      {successMessage && <div className="success-banner">{successMessage}</div>}

      <main className="app-main">
        <Statistics statistics={statistics} />

        <div className="actions">
          <button
            onClick={handleManualPing}
            className="btn btn-primary"
            disabled={isTriggeringPing}
            aria-label="Trigger manual ping to httpbin.org"
          >
            {isTriggeringPing ? (
              <>
                <span className="spinner-small" aria-hidden="true"></span>
                Pinging...
              </>
            ) : (
              <>🔄 Trigger Manual Ping</>
            )}
          </button>

          <button
            onClick={handleRefresh}
            className="btn btn-secondary"
            disabled={isRefreshing}
            aria-label="Refresh data from server"
          >
            {isRefreshing ? (
              <>
                <span className="spinner-small" aria-hidden="true"></span>
                Refreshing...
              </>
            ) : (
              <>↻ Refresh Data</>
            )}
          </button>
        </div>

        <ResponseTable
          responses={responses}
          loading={isLoading}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </main>

      <footer className="app-footer">
        <p>
          Pings httpbin.org every 5 minutes • Real-time updates via WebSocket
        </p>
      </footer>
    </div>
  );
}

export default App;
// import { ResponseTable } from "./components/ResponseTable";
// import { Statistics } from "./components/Statistics";
// import { useWebSocket } from "./hooks/useWebSocket";
// import { useApi } from "./hooks/useApi";
// import type { HttpResponse, Statistics as StatisticsType } from "./types";
// import "./App.css";

// function App() {
//   const [responses, setResponses] = useState<HttpResponse[]>([]);
//   const [statistics, setStatistics] = useState<StatisticsType | null>(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [isLoading, setIsLoading] = useState(true);
//   const [errorMessage, setErrorMessage] = useState<string | null>(null);
//   const [isTriggeringPing, setIsTriggeringPing] = useState(false);
//   const [isRefreshing, setIsRefreshing] = useState(false);
//   const [successMessage, setSuccessMessage] = useState<string | null>(null);

//   const { fetchResponses, fetchStatistics, triggerManualPing } = useApi();

//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   const loadResponses = useCallback(async (pageNumber: number): Promise<void> => {
//     try {
//       setIsLoading(true);
//       setErrorMessage(null);

//       const responseData = await fetchResponses(pageNumber, 20);
//       setResponses(responseData.data);
//       setTotalPages(responseData.pagination.totalPages);
//     } catch (error) {
//       const message =
//         error instanceof Error ? error.message : "Failed to load responses";
//       setErrorMessage(message);
//       console.error("Error loading responses:", error);
//     } finally {
//       setIsLoading(false);
//     }
//   }, []);

//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   const loadStatistics = useCallback(async (): Promise<void> => {
//     try {
//       const statsData = await fetchStatistics();
//       setStatistics(statsData);
//     } catch (error) {
//       console.error("Error loading statistics:", error);
//     }
//   }, []);

//   // WebSocket: prepend new responses and refresh statistics
//   useWebSocket((newResponse: HttpResponse) => {
//     setResponses((prev) => [newResponse, ...prev]);
//     loadStatistics();
//   });

//   const handleManualPing = async (): Promise<void> => {
//     try {
//       setIsTriggeringPing(true);
//       setErrorMessage(null);
//       setSuccessMessage(null);

//       const result = await triggerManualPing();

//       if (result.statusCode >= 200 && result.statusCode < 300) {
//         setSuccessMessage(`✅ Ping successful! Status: ${result.statusCode}`);
//       } else if (result.statusCode === 0) {
//         setErrorMessage(
//           `❌ Unable to reach httpbin.org. The external service may be down.`
//         );
//       } else if (result.statusCode >= 400) {
//         const errorDetail = result.error || "Error occurred";
//         setErrorMessage(
//           `⚠️ Request failed! httpbin.org returned status ${result.statusCode}: ${errorDetail}`
//         );
//       }

//       // Auto-clear messages after 3 seconds
//       setTimeout(() => {
//         setSuccessMessage(null);
//         setErrorMessage(null);
//       }, 3000);
//     } catch (error) {
//       const message =
//         error instanceof Error ? error.message : "Failed to trigger ping";
//       setErrorMessage(message);
//     } finally {
//       setIsTriggeringPing(false);
//     }
//   };

//   const handleRefresh = async (): Promise<void> => {
//     try {
//       setIsRefreshing(true);
//       setErrorMessage(null);

//       await loadResponses(currentPage);
//       await loadStatistics();

//       setSuccessMessage("✅ Data refreshed successfully!");
//       setTimeout(() => setSuccessMessage(null), 2000);
//     } catch (error) {
//       const message =
//         error instanceof Error ? error.message : "Failed to refresh data";
//       setErrorMessage(message);
//     } finally {
//       setIsRefreshing(false);
//     }
//   };

//   const handlePageChange = (newPage: number): void => {
//     if (newPage >= 1 && newPage <= totalPages) {
//       setCurrentPage(newPage);
//     }
//   };

//   useEffect(() => {
//     loadResponses(currentPage);
//     loadStatistics();
//   }, [currentPage, loadResponses, loadStatistics]);

//   return (
//     <div className="app">
//       <header className="app-header">
//         <h1>HTTP Response Monitor</h1>
//         <p className="subtitle">Real-time monitoring of httpbin.org/anything</p>
//       </header>

//       {errorMessage && (
//         <div className="error-banner">
//           {errorMessage.includes("⚠️") || errorMessage.includes("❌")
//             ? ""
//             : "⚠️ "}
//           {errorMessage}
//           {errorMessage.includes("Backend may be down") && (
//             <>
//               <br />
//               <small>
//                 Make sure the backend is running on http://localhost:3001
//               </small>
//             </>
//           )}
//         </div>
//       )}

//       {successMessage && <div className="success-banner">{successMessage}</div>}

//       <main className="app-main">
//         <Statistics statistics={statistics} />

//         <div className="actions">
//           <button
//             onClick={handleManualPing}
//             className="btn btn-primary"
//             disabled={isTriggeringPing}
//             aria-label="Trigger manual ping to httpbin.org"
//           >
//             {isTriggeringPing ? (
//               <>
//                 <span className="spinner-small" aria-hidden="true"></span>
//                 Pinging...
//               </>
//             ) : (
//               <>🔄 Trigger Manual Ping</>
//             )}
//           </button>

//           <button
//             onClick={handleRefresh}
//             className="btn btn-secondary"
//             disabled={isRefreshing}
//             aria-label="Refresh data from server"
//           >
//             {isRefreshing ? (
//               <>
//                 <span className="spinner-small" aria-hidden="true"></span>
//                 Refreshing...
//               </>
//             ) : (
//               <>↻ Refresh Data</>
//             )}
//           </button>
//         </div>

//         <ResponseTable
//           responses={responses}
//           loading={isLoading}
//           currentPage={currentPage}
//           totalPages={totalPages}
//           onPageChange={handlePageChange}
//         />
//       </main>

//       <footer className="app-footer">
//         <p>
//           Pings httpbin.org every 5 minutes • Real-time updates via WebSocket
//         </p>
//       </footer>
//     </div>
//   );
// }

// export default App;
