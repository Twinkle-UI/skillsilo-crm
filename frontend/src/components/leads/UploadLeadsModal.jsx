import { useState, useRef } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function UploadLeadsModal({ onClose, onSuccess }) {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Handle file selection
  const handleFileSelect = (selectedFile) => {
    setError('');
    setResult(null);

    if (!selectedFile) return;

    const fileName = selectedFile.name.toLowerCase();
    const isCSV = fileName.endsWith('.csv');
    const isXLSX = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

    if (!isCSV && !isXLSX) {
      setError('Please select a CSV or Excel file (.csv, .xlsx, .xls)');
      return;
    }

    // Bigger limit for Excel (10 MB)
    const maxSize = isXLSX ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError(`File too large. Max ${isXLSX ? '10MB' : '5MB'} allowed.`);
      return;
    }

    setFile(selectedFile);
  };

  const handleFileChange = (e) => {
    handleFileSelect(e.target.files[0]);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleBrowse = () => {
    fileInputRef.current?.click();
  };

  // Read file as text (for CSV)
  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  // Read file as base64 (for Excel)
  const readFileAsBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        // result is "data:...;base64,XXXXX" - we want just XXXXX
        const dataUrl = e.target.result;
        const base64 = dataUrl.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Upload + Import
  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const fileName = file.name.toLowerCase();
      const isXLSX = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

      let body;
      if (isXLSX) {
        const base64 = await readFileAsBase64(file);
        body = JSON.stringify({ xlsxBase64: base64 });
      } else {
        const csv = await readFileAsText(file);
        body = JSON.stringify({ csv });
      }

      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/leads/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Import failed');
      }

      setResult(data.data);

      if (data.data.imported > 0 && onSuccess) {
        onSuccess(data.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Download sample CSV
  const handleDownloadSample = () => {
    const sample = [
      'Full Name,Mobile,Email,Department,Category,Specialization,Stage,Reason,Source,Sub-Source,Country,State,City,Owner,Total Calls,Last Remark',
      'John Doe,9876543210,john@example.com,Vikrant University,Regular Program,B.Tech CSE,New Leads,Make First Call,Meta Ads,Department of Engineering,India,Maharashtra,Mumbai,,0,Interested in B.Tech',
      'Jane Smith,9123456789,jane@example.com,GLA University,Regular Program,MBA,Call Back Later,Busy Call Back Later,Google Ads,,India,Delhi,New Delhi,,2,Wants admission info'
    ].join('\n');

    const blob = new Blob([sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads-sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content upload-leads-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Upload Leads (CSV / Excel)</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {!result && (
            <div className="upload-instructions">
              <p>
                Upload a <strong>CSV (.csv)</strong> or <strong>Excel (.xlsx)</strong> file. The first row must be headers.
                Duplicate phone numbers will be skipped automatically.
              </p>
              <button
                type="button"
                className="link-btn"
                onClick={handleDownloadSample}
              >
                📥 Download sample CSV
              </button>
            </div>
          )}

          {error && <div className="login-error">❌ {error}</div>}

          {!result && (
            <div
              className={`upload-dropzone ${dragActive ? 'drag-active' : ''} ${
                file ? 'has-file' : ''
              }`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={handleBrowse}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />

              {file ? (
                <>
                  <div className="upload-icon">📄</div>
                  <div className="upload-filename">{file.name}</div>
                  <div className="upload-filesize">
                    {(file.size / 1024).toFixed(2)} KB
                  </div>
                  <button
                    type="button"
                    className="link-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReset();
                    }}
                  >
                    Choose different file
                  </button>
                </>
              ) : (
                <>
                  <div className="upload-icon">📁</div>
                  <div className="upload-text">
                    <strong>Click to browse</strong> or drag and drop
                  </div>
                  <div className="upload-hint">
                    CSV or Excel files (.csv, .xlsx), max 10MB
                  </div>
                </>
              )}
            </div>
          )}

          {result && (
            <div className="upload-result">
              <div className="upload-result-icon">
                {result.imported > 0 ? '✅' : '⚠️'}
              </div>
              <h3>Import Complete</h3>

              <div className="upload-stats">
                <div className="stat-item stat-total">
                  <div className="stat-num">{result.total}</div>
                  <div className="stat-label">Total Rows</div>
                </div>
                <div className="stat-item stat-success">
                  <div className="stat-num">{result.imported}</div>
                  <div className="stat-label">Imported</div>
                </div>
                <div className="stat-item stat-skipped">
                  <div className="stat-num">{result.skipped}</div>
                  <div className="stat-label">Skipped</div>
                </div>
                <div className="stat-item stat-failed">
                  <div className="stat-num">{result.failed}</div>
                  <div className="stat-label">Failed</div>
                </div>
              </div>

              {result.errors && result.errors.length > 0 && (
                <div className="upload-errors">
                  <h4>Errors:</h4>
                  <ul>
                    {result.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="upload-result-actions">
                <button
                  type="button"
                  className="settings-btn-secondary"
                  onClick={handleReset}
                >
                  Upload Another
                </button>
                <button
                  type="button"
                  className="settings-btn"
                  onClick={onClose}
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        {!result && (
          <div className="modal-footer upload-modal-footer">
            <button
              type="button"
              className="settings-btn-secondary"
              onClick={onClose}
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="settings-btn"
              onClick={handleUpload}
              disabled={!file || uploading}
            >
              {uploading ? 'Uploading...' : '⬆ Upload & Import'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}