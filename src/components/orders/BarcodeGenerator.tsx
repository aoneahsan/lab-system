import React, { useEffect, useRef } from 'react';
import { Printer, Download } from 'lucide-react';
import JsBarcode from 'jsbarcode';

interface BarcodeGeneratorProps {
  value: string;
  format?: string;
  width?: number;
  height?: number;
  displayValue?: boolean;
  text?: string;
  fontSize?: number;
  className?: string;
}

export default function BarcodeGenerator({
  value,
  format = 'CODE128',
  width = 2,
  height = 100,
  displayValue = true,
  text,
  fontSize = 20,
  className = ''
}: BarcodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      JsBarcode(svgRef.current, value, {
        format,
        width,
        height,
        displayValue,
        text: text || value,
        fontSize,
        margin: 10,
        background: '#ffffff',
        lineColor: '#000000'
      });
    }
  }, [value, format, width, height, displayValue, text, fontSize]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const svgContent = svgRef.current?.outerHTML || '';
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Barcode</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          ${svgContent}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  const handleDownload = () => {
    if (!canvasRef.current || !svgRef.current) return;

    // Convert SVG to Canvas
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      // Download as PNG
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `barcode-${value}.png`;
        a.click();
        URL.revokeObjectURL(url);
      });
      
      URL.revokeObjectURL(svgUrl);
    };
    img.src = svgUrl;
  };

  return (
    <div className={`bg-white p-4 rounded-lg border border-gray-200 ${className}`}>
      <div className="mb-4">
        <svg ref={svgRef}></svg>
        <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
      </div>
      
      <div className="flex justify-center gap-2">
        <button
          onClick={handlePrint}
          className="btn btn-secondary"
          title="Print Barcode"
        >
          <Printer className="h-4 w-4" />
          Print
        </button>
        <button
          onClick={handleDownload}
          className="btn btn-secondary"
          title="Download Barcode"
        >
          <Download className="h-4 w-4" />
          Download
        </button>
      </div>
    </div>
  );
}