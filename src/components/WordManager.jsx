import React, { useState, useRef } from 'react';
import { parseWordList } from '../utils/storage';

function SavingIndicator({ saving }) {
  if (!saving) return null;
  return (
    <span className="flex items-center gap-1 text-xs text-purple-500">
      <span className="w-3 h-3 border border-purple-400 border-t-transparent rounded-full animate-spin inline-block" />
      Đang lưu...
    </span>
  );
}

export default function WordManager({
  words,
  saving,
  saveError,
  wordsLoading,
  onAddWord,
  onRemoveWordAt,
  onImportWords,
  onClearWords,
  onLoadDefaultWords,
  onBack,
}) {
  const [inputValue, setInputValue] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [activeTab, setActiveTab] = useState('single');
  const [message, setMessage] = useState(null);
  const fileInputRef = useRef(null);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleAddWord = async () => {
    const word = inputValue.trim();
    if (!word) {
      showMessage('error', 'Vui lòng nhập từ!');
      return;
    }
    const result = await onAddWord(word);
    if (result.added) {
      setInputValue('');
      showMessage('success', `Đã thêm "${word}"!`);
    } else if (result.reason === 'duplicate') {
      showMessage('error', `Từ "${word}" đã có trong danh sách!`);
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') handleAddWord();
  };

  const handleImportPaste = async () => {
    if (!pasteText.trim()) {
      showMessage('error', 'Vui lòng nhập danh sách từ!');
      return;
    }
    const parsed = parseWordList(pasteText);
    if (parsed.length === 0) {
      showMessage('error', 'Không tìm thấy từ nào. Mỗi từ trên một dòng hoặc cách nhau bằng dấu phẩy.');
      return;
    }
    const result = await onImportWords(pasteText);
    setPasteText('');
    showMessage('success', `Đã thêm ${result.added} từ mới (bỏ qua ${result.total - result.added} từ trùng)!`);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.txt')) {
      showMessage('error', 'Chỉ chấp nhận file .txt!');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result || '';
      const parsed = parseWordList(text);
      if (parsed.length === 0) {
        showMessage('error', 'File không chứa từ nào hợp lệ!');
        return;
      }
      const result = await onImportWords(text);
      showMessage('success', `Đã nhập ${result.added} từ mới từ file ${file.name}!`);
    };
    reader.onerror = () => showMessage('error', 'Không đọc được file!');
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  const handleLoadDefaults = async () => {
    const added = await onLoadDefaultWords();
    if (added > 0) {
      showMessage('success', `Đã thêm ${added} từ mẫu!`);
    } else {
      showMessage('error', 'Tất cả từ mẫu đã có trong danh sách rồi!');
    }
  };

  const handleRemoveWord = async (index) => {
    await onRemoveWordAt(index);
  };

  const handleClearAll = async () => {
    if (window.confirm(`Bạn có chắc muốn xóa tất cả ${words.length} từ không?`)) {
      await onClearWords();
      showMessage('success', 'Đã xóa tất cả từ!');
    }
  };

  const tabs = [
    { id: 'single', label: '➕ Thêm từ', icon: '✏️' },
    { id: 'paste', label: '📋 Dán danh sách', icon: '📋' },
    { id: 'file', label: '📁 Upload file', icon: '📁' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-100 via-pink-50 to-yellow-100">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-purple-100 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-purple-600 hover:text-purple-800 font-semibold btn-press"
          >
            <span>←</span>
            <span>Quay lại</span>
          </button>
          <h1 className="text-lg md:text-xl font-bold text-purple-800 flex-1 text-center">
            📚 Quản lý từ vựng
          </h1>
          <div className="flex items-center gap-2">
            <SavingIndicator saving={saving} />
            <span className="text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-semibold">
              {words.length} từ
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Toast message */}
        {message && (
          <div className={`mb-4 p-3 rounded-xl text-center font-semibold text-sm
            ${message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}
          `}>
            {message.type === 'success' ? '✅ ' : '❌ '}{message.text}
          </div>
        )}

        {/* Save error */}
        {saveError && (
          <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-xl text-orange-700 text-sm text-center">
            ⚠️ {saveError}
          </div>
        )}

        {/* Quick actions */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={handleLoadDefaults}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-sm font-semibold hover:bg-amber-100 transition-all btn-press disabled:opacity-60"
          >
            <span>⭐</span>
            <span>Dùng từ mẫu</span>
          </button>
          {words.length > 0 && (
            <button
              onClick={handleClearAll}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-100 transition-all btn-press disabled:opacity-60"
            >
              <span>🗑️</span>
              <span>Xóa tất cả</span>
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-purple-100 overflow-hidden mb-6">
          <div className="flex border-b border-gray-100">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 text-xs md:text-sm font-semibold transition-all
                  ${activeTab === tab.id
                    ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-500'
                    : 'text-gray-500 hover:text-purple-600 hover:bg-gray-50'
                  }`}
              >
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.icon}</span>
              </button>
            ))}
          </div>

          <div className="p-4">
            {/* Single word */}
            {activeTab === 'single' && (
              <div>
                <p className="text-sm text-gray-600 mb-3">Nhập một từ tiếng Anh và nhấn Thêm:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    placeholder="Nhập từ tiếng Anh..."
                    className="flex-1 px-4 py-2.5 border-2 border-purple-200 rounded-xl text-base focus:outline-none focus:border-purple-500 transition-colors"
                    autoFocus
                    disabled={saving}
                  />
                  <button
                    onClick={handleAddWord}
                    disabled={saving || !inputValue.trim()}
                    className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold hover:from-purple-600 hover:to-pink-600 transition-all shadow-md btn-press text-sm disabled:opacity-60"
                  >
                    Thêm
                  </button>
                </div>
              </div>
            )}

            {/* Paste list */}
            {activeTab === 'paste' && (
              <div>
                <p className="text-sm text-gray-600 mb-3">
                  Dán danh sách từ — mỗi dòng hoặc cách nhau bằng dấu phẩy:
                </p>
                <textarea
                  value={pasteText}
                  onChange={e => setPasteText(e.target.value)}
                  placeholder={'apple, banana, cat\ndog\nelephant, fish...'}
                  rows={5}
                  className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 transition-colors resize-none font-mono"
                  disabled={saving}
                />
                <button
                  onClick={handleImportPaste}
                  disabled={!pasteText.trim() || saving}
                  className="mt-3 w-full py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold hover:from-purple-600 hover:to-pink-600 transition-all shadow-md btn-press disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  📥 Nhập danh sách
                </button>
              </div>
            )}

            {/* File upload */}
            {activeTab === 'file' && (
              <div>
                <p className="text-sm text-gray-600 mb-3">
                  Upload file .txt — mỗi từ trên một dòng hoặc cách nhau bằng dấu phẩy:
                </p>
                <div
                  className="border-2 border-dashed border-purple-300 rounded-xl p-8 text-center cursor-pointer hover:bg-purple-50 transition-all"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="text-4xl mb-3">📁</div>
                  <p className="text-purple-700 font-semibold mb-1">Nhấn để chọn file .txt</p>
                  <p className="text-gray-500 text-xs">Hỗ trợ file text (.txt)</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            )}
          </div>
        </div>

        {/* Word list */}
        <div className="bg-white rounded-2xl shadow-sm border border-purple-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-800">
              Danh sách từ ({words.length})
            </h2>
            {words.length > 0 && (
              <p className="text-xs text-gray-400">Nhấn ✕ để xóa</p>
            )}
          </div>

          {wordsLoading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Đang tải từ vựng của bạn...</p>
            </div>
          ) : words.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-5xl mb-3">📭</div>
              <p className="text-gray-500 font-medium">Chưa có từ nào</p>
              <p className="text-gray-400 text-sm mt-1">Thêm từ hoặc dùng từ mẫu bên trên!</p>
            </div>
          ) : (
            <div className="p-3 max-h-80 overflow-y-auto">
              <div className="flex flex-wrap gap-2">
                {words.map((word, index) => (
                  <div
                    key={`${word}-${index}`}
                    className="word-card flex items-center gap-1.5 bg-purple-50 border border-purple-200 rounded-full px-3 py-1.5 group"
                  >
                    <span className="text-purple-800 font-semibold text-sm capitalize">{word}</span>
                    <button
                      onClick={() => handleRemoveWord(index)}
                      disabled={saving}
                      className="w-5 h-5 rounded-full bg-purple-200 text-purple-600 hover:bg-red-200 hover:text-red-600 flex items-center justify-center text-xs font-bold transition-colors disabled:opacity-50"
                      title="Xóa từ này"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
