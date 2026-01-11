import React from 'react';

const A4PrintWrapper = ({ children }) => {
  return (
    <div className="relative z-0">
      {/* Print styles for A4 format */}
      <style jsx global>{`
        @media print {
          /* Reset all page margins */
          @page {
            size: A4;
            margin: 0;
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

          /* Position the bill at the top-left corner */
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm;
            min-height: 297mm;
            padding: 20mm;
          }

          /* Hide all buttons and navigation elements */
          .no-print {
            display: none !important;
          }

          /* Remove background colors and shadows for better printing */
          * {
            background-color: white !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }

        /* Styles for the preview */
        .print-content {
          width: 210mm;
          min-height: 297mm;
          background: white;
          padding: 20mm;
          margin: auto;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }

        /* Container for print button */
        .print-button-container {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 50;
        }
      `}</style>

      {/* Print Button Container - hidden during print */}
      {/* <div className="print-button-container no-print">
        <button
          onClick={() => window.print()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow"
        >
          Print Bill
        </button>
      </div> */}

      {/* Bill Content - centered and properly sized for print */}
      <div className="min-h-screen flex items-center justify-center p-4 z-10">
        <div className="print-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default A4PrintWrapper;