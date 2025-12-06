import React, { useState, useCallback } from 'react';
import { FaFilePdf, FaDownload, FaTrash, FaUpload } from 'react-icons/fa';
import '../styles/ComponentPdfSection.css';

const ComponentPdfSection = ({ componentId, pdfInfo, onPdfUpdate }) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== 'application/pdf') {
      alert('Пожалуйста, выберите PDF файл');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert('Размер файла не должен превышать 10MB');
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const pdfData = e.target.result.split(',')[1]; // Remove data URL prefix
        const result = await window.api.database.uploadComponentPdf(
          componentId,
          pdfData,
          file.name,
          file.size
        );
        
        if (result.success) {
          onPdfUpdate({
            pdf_filename: file.name,
            pdf_size: file.size,
            has_pdf: true
          });
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading PDF:', error);
      alert('Ошибка при загрузке PDF');
    } finally {
      setIsUploading(false);
    }
  }, [componentId, onPdfUpdate]);

  const handleDownload = useCallback(async () => {
    try {
      const pdfData = await window.api.database.getComponentPdf(componentId);
      if (pdfData && pdfData.pdf_data) {
        const blob = new Blob(
          [Uint8Array.from(atob(pdfData.pdf_data), c => c.charCodeAt(0))],
          { type: 'application/pdf' }
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = pdfData.pdf_filename || 'document.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Ошибка при загрузке PDF');
    }
  }, [componentId]);

  const handleRemove = useCallback(async () => {
    if (window.confirm('Удалить прикрепленный PDF файл?')) {
      try {
        const result = await window.api.database.removeComponentPdf(componentId);
        if (result.success) {
          onPdfUpdate({
            pdf_filename: null,
            pdf_size: 0,
            has_pdf: false
          });
        }
      } catch (error) {
        console.error('Error removing PDF:', error);
        alert('Ошибка при удалении PDF');
      }
    }
  }, [componentId, onPdfUpdate]);

  if (!pdfInfo.has_pdf) {
    return (
      <div className="pdf-section pdf-empty">
        <FaFilePdf className="pdf-icon" />
        <div className="pdf-info">
          <h3>PDF документ</h3>
          <p>Нет прикрепленного PDF файла</p>
        </div>
        <div className="pdf-actions">
          <label className="btn-pdf-upload">
            <FaUpload />
            <span>Загрузить PDF</span>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              disabled={isUploading}
            />
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="pdf-section pdf-has-file">
      <FaFilePdf className="pdf-icon" />
      <div className="pdf-info">
        <h3>PDF документ</h3>
        <p className="pdf-filename">{pdfInfo.pdf_filename}</p>
        <p className="pdf-size">
          {(pdfInfo.pdf_size / 1024 / 1024).toFixed(2)} MB
        </p>
      </div>
      <div className="pdf-actions">
        <button className="btn-pdf-download" onClick={handleDownload}>
          <FaDownload />
          <span>Скачать</span>
        </button>
        <button className="btn-pdf-remove" onClick={handleRemove}>
          <FaTrash />
          <span>Удалить</span>
        </button>
        <label className="btn-pdf-replace">
          <FaUpload />
          <span>Заменить</span>
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            disabled={isUploading}
          />
        </label>
      </div>
    </div>
  );
};

export default React.memo(ComponentPdfSection);
