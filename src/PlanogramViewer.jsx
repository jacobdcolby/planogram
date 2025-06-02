import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Package, BarChart3 } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import './PlanogramViewer.css';
const PDF_REFERENCE_FILENAME = "Summer2025FootwearPlanogram.pdf";

const PlanogramViewer = () => {
  const [planogramData, setPlanogramData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const barcodeRef = useRef(null);
  const planogramDataPath = `${import.meta.env.BASE_URL}planogramData.json`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(planogramDataPath);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setPlanogramData(data);
      } catch (e) {
        setError(e.message);
        console.error("Failed to fetch planogram data:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredConfigs = useMemo(() => {
    if (!searchTerm) return planogramData;
    return planogramData.filter(config =>
      config.core_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      config.planogramTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [planogramData, searchTerm]);

  const handleConfigSelect = (config) => {
    setSelectedConfig(config);
    setSelectedStyle(null); // Hide sticky footer when new config is selected
  };

  const handleStyleSelect = (style) => {
    // Toggle selection for the footer display
    if (selectedStyle && selectedStyle.UPC === style.UPC) {
      setSelectedStyle(null); // Hide if already selected
    } else {
      setSelectedStyle(style); // Show for new selection
    }
  };

  useEffect(() => {
    if (selectedStyle && selectedStyle.UPC && barcodeRef.current) {
      try {
        const svgElement = barcodeRef.current;
        while (svgElement.firstChild) {
          svgElement.removeChild(svgElement.firstChild);
        }
        JsBarcode(svgElement, selectedStyle.UPC, {
          format: "CODE128",
          lineColor: "#000",
          width: 1.8,
          height: 50,
          displayValue: false, // UPC text under barcode is hidden
          margin: 5,
        });
      } catch (e) {
        console.error("Error generating barcode:", e);
        if (barcodeRef.current) {
          const svgElement = barcodeRef.current;
          while (svgElement.firstChild) {
            svgElement.removeChild(svgElement.firstChild);
          }
        }
      }
    } else if (barcodeRef.current) {
      const svgElement = barcodeRef.current;
      while (svgElement.firstChild) {
        svgElement.removeChild(svgElement.firstChild);
      }
    }
  }, [selectedStyle]);

  if (isLoading) {
    return <div className="loading-state"><p>Loading data...</p></div>;
  }
  if (error) {
    return <div className="error-state"><p>Error loading data: {error}</p></div>;
  }

  return (
    <div className="planogram-viewer-container">
      <div className="content-wrapper"> {/* This div has padding-bottom in your CSS */}
        <header className="viewer-header">
          <h1 className="viewer-title">Planogram Viewer</h1> {/* As per your latest file */}
          <p className="viewer-subtitle">Footwear - Summer 2025</p> {/* As per your latest file */}
        </header>

        <div className="panels-area"> {/* main-content-area class was removed as content-wrapper has padding */}
          {/* Config Selection Panel */}
          <div className="panel-container">
            <div className="panel config-panel">
              <h2 className="panel-title">
                <BarChart3 className="panel-icon" size={20} />
                Layouts
              </h2>
              <div className="search-container">
                <Search className="search-icon" size={16} />
                <input
                  type="text"
                  placeholder="Search for specific layouts."
                  className="search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="items-list config-items-list">
                {filteredConfigs.length > 0 ? filteredConfigs.map((config) => (
                  <button
                    key={config.core_id}
                    onClick={() => handleConfigSelect(config)}
                    className={`item-button config-item ${
                      selectedConfig?.core_id === config.core_id ? 'selected' : ''
                    }`}
                  >
                    <div className="item-main-text">{config.planogramTitle}</div>
                    <div className="item-detail-text">
                      {config.merchandisedStyles.length} styles
                    </div>
                  </button>
                )) : <p className="empty-list-message">No layouts found.</p>}
              </div>
            </div>
          </div>

          {/* Styles Panel */}
          <div className="panel-container">
            <div className="panel styles-panel">
              <h2 className="panel-title">
                <Package className="panel-icon" size={20} />
                Styles
              </h2>
              {selectedConfig ? (
                <div className="items-list style-items-list">
                  {selectedConfig.merchandisedStyles.map((style) => (
                    <button
                      key={style.UPC}
                      onClick={() => handleStyleSelect(style)}
                      className={`item-button style-item ${
                        selectedStyle?.UPC === style.UPC ? 'selected' : ''
                      }`}
                    >
                      <div className="style-item-layout-container">
                        {style["P#"] && (
                          // Added span back for consistency with CSS for vertical centering
                          <div className="style-item-p-number"><span>{style["P#"]}</span></div>
                        )}
                        <div className="style-item-info-group">
                          {style.NAME && (
                            <div className="style-item-name">{style.NAME}</div>
                          )}
                          {style.BRAND && ( // Brand is still in data, just not shown in sticky footer
                            <div className="item-brand-text">{style.BRAND}</div>
                          )}
                          <div className="style-item-code">{style["STYLE #"]}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="panel-placeholder">
                  Select a layout to view the corresponding styles.
                </div>
              )}
            </div>
          </div>

          {/* Original UPC Barcode Panel is REMOVED from the grid */}
        </div>

        {selectedConfig && (
          <footer className="selected-config-details-footer">
            {selectedConfig.sourcePageNumbers && selectedConfig.sourcePageNumbers.length > 0 && (
              <a
                href={`${import.meta.env.BASE_URL}${PDF_REFERENCE_FILENAME}#page=${selectedConfig.sourcePageNumbers[0]}`}
                target="_blank"
                rel="noopener noreferrer"
                className="view-on-planogram-button"
                title={`View on Planogram (Page ${selectedConfig.sourcePageNumbers[0]})`}
              >
                View on Planogram
              </a>
            )}
          </footer>
        )}
      </div>

      {/* Sticky Footer for Barcode */}
      {selectedStyle && (
        <div className="sticky-barcode-footer">
          <div className="footer-style-info">
            {selectedStyle.NAME && (
              <div className="footer-style-name">{selectedStyle.NAME}</div>
            )}
            {/* MODIFIED: Display UPC instead of Brand */}
            <div className="footer-style-upc">UPC: {selectedStyle.UPC}</div>
          </div>
          <div className="footer-barcode-image-container">
            <svg ref={barcodeRef} className="footer-barcode-svg"></svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanogramViewer;