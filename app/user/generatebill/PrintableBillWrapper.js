import React, { useState, useEffect } from 'react';

const PrintableBillWrapper = ({ children, paperType: initialPaperType = 'a4' }) => {
  const [paperType, setPaperType] = useState(initialPaperType);
  
  // On mount, check if there's a paperType in URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paperTypeParam = urlParams.get('paperType');
    if (paperTypeParam) {
      setPaperType(paperTypeParam);
    }
  }, []);

  // Determine paper size based on selected type
  const isPaperTypeA4 = paperType === 'a4';
  
  // Handle paper type change without page reload
  const handlePaperTypeChange = (e) => {
    const newPaperType = e.target.value;
    setPaperType(newPaperType);
    
    // Update URL without page reload
    const url = new URL(window.location);
    url.searchParams.set('paperType', newPaperType);
    window.history.pushState({}, '', url);
  };

  return (
    <div className="relative">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="mb-4 no-print">
          <label className="mr-2 font-medium">Paper Type:</label>
          <select
            className="border rounded px-2 py-1"
            value={paperType}
            onChange={handlePaperTypeChange}
          >
            <option value="thermal">Thermal (80mm)</option>
            <option value="a4">A4</option>
          </select>
          
          <button 
            className="ml-4 bg-blue-600 text-white px-4 py-1 rounded"
            onClick={() => window.print()}
          >
            Print
          </button>
        </div>

        <style jsx global>{`
          @media print {
            /* Reset page margins and set paper size based on selection */
            @page {
              size: ${isPaperTypeA4 ? 'A4' : '80mm auto'};
              margin: ${isPaperTypeA4 ? '0' : '0'};
            }
            
            /* Hide everything except the bill */
            body * {
              visibility: hidden;
            }
            
            /* Show only the bill content */
            .print-content,
            .print-content * {
              visibility: visible;
            }
            
            /* Position the bill precisely */
            .print-content {
              position: absolute;
              left: 0;
              top: 0;
              ${isPaperTypeA4 ? `
                width: 100%;
                height: 100%;
                padding: 0;
                box-sizing: border-box;
              ` : `
                width: 80mm;
                padding: 2mm;
              `}
              margin: 0;
            }
            
            /* Remove all non-printable elements */
            .no-print {
              display: none !important;
            }
            
            /* Optimize for printing */
            * {
              background: none !important;
              box-shadow: none !important;
              color: black !important;
              font-family: 'Times New Roman', serif !important;
              line-height: 1.3 !important;
            }
            
            /* Increase text visibility and thickness */
            p, span, div {
              font-weight: 600 !important;
              font-size: ${isPaperTypeA4 ? '12pt' : '11pt'} !important;
            }
            
            /* Enhance headings */
            h1, h2, h3, h4 {
              font-weight: 800 !important;
              font-size: ${isPaperTypeA4 ? '16pt' : '14pt'} !important;
            }
          }
          
          /* Preview styles */
          .print-content {
            ${isPaperTypeA4 ? `
              width: 210mm;
              min-height: 297mm;
              box-sizing: border-box;
            ` : `
              width: 80mm;
            `}
            background: white;
            padding: ${isPaperTypeA4 ? '10mm' : '2mm'};
            font-family: 'Times New Roman', serif;
            box-shadow: 0 0 5px rgba(0,0,0,0.1);
            line-height: 1.3;
            font-weight: 600;
          }
        `}</style>
        
        <div className="print-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default PrintableBillWrapper;