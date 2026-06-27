import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Edit3 } from 'lucide-react';
import { uploadBillOCR } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
  onExtracted: (data: { bill?: number; kwh?: number }) => void;
}

export default function OCRUpload({ onExtracted }: Props) {
  const { t } = useLanguage();
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [extracted, setExtracted] = useState<{ bill?: number; kwh?: number } | null>(null);
  const [confidence, setConfidence] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setStatus('uploading');
    setMessage('');
    setExtracted(null);

    try {
      const result = await uploadBillOCR(file);
      if (result.success) {
        setStatus('success');
        setConfidence(result.confidence || 'medium');
        setMessage(result.message || 'Data extracted successfully');
        const data = {
          bill: result.extracted_bill ?? undefined,
          kwh: result.extracted_kwh ?? undefined,
        };
        setExtracted(data);
        onExtracted(data);
      } else {
        setStatus('error');
        setMessage(result.message || 'Could not extract data. Please enter values manually.');
      }
    } catch {
      setStatus('error');
      setMessage('OCR service unavailable. Please enter values manually.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const resetUpload = () => {
    setStatus('idle');
    setMessage('');
    setExtracted(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="card p-6">
      <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
        <FileText className="w-4 h-4 text-teal-600" />
        {t.calc.uploadBill}
      </h3>
      <p className="text-xs text-slate-500 mb-4">{t.calc.uploadDesc}</p>

      <motion.div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => status !== 'success' && fileRef.current?.click()}
        whileHover={{ scale: status === 'success' ? 1 : 1.01 }}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
          status === 'success'
            ? 'border-green-300 bg-green-50/50 cursor-default'
            : 'border-slate-200 hover:border-teal-400 cursor-pointer'
        }`}
      >
        {status === 'uploading' ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
            <p className="text-sm text-slate-500">AI is reading your bill...</p>
          </div>
        ) : status === 'success' && extracted ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <p className="text-sm text-green-700 font-medium">Data Extracted</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                confidence === 'high' ? 'bg-green-100 text-green-700' :
                confidence === 'medium' ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              }`}>
                {confidence} confidence
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
              {extracted.bill != null && (
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <p className="text-xs text-slate-500">Bill Amount</p>
                  <p className="text-lg font-bold text-green-600">{extracted.bill.toLocaleString()} SAR</p>
                </div>
              )}
              {extracted.kwh != null && (
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <p className="text-xs text-slate-500">Consumption</p>
                  <p className="text-lg font-bold text-green-600">{extracted.kwh.toLocaleString()} kWh</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); resetUpload(); }}
                className="text-xs text-slate-500 hover:text-teal-600 flex items-center gap-1"
              >
                <Upload className="w-3 h-3" /> Upload different file
              </button>
              <span className="text-slate-300">|</span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Edit3 className="w-3 h-3" /> Edit values in the form above
              </span>
            </div>
          </div>
        ) : status === 'error' ? (
          <div className="flex flex-col items-center gap-2">
            <AlertCircle className="w-8 h-8 text-amber-500" />
            <p className="text-sm text-amber-600">{message}</p>
            <p className="text-xs text-slate-400">Click to try again or enter values manually</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-slate-400" />
            <p className="text-sm text-slate-500">Click to upload or drag & drop</p>
            <p className="text-xs text-slate-400">Supports PDF, JPG, PNG (max 10MB)</p>
          </div>
        )}
      </motion.div>

      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
