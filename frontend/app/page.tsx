"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!text.trim()) return alert("Please enter some text");
    
    setIsLoading(true);
    localStorage.setItem("userText", text);
    router.push("/result");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center p-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 max-w-3xl w-full border border-white/50">
        
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <i className="fas fa-brain text-white text-2xl"></i>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Smart AI Study Assistant
          </h1>
          <p className="text-gray-600 text-lg max-w-md mx-auto">
            Transform your notes into comprehensive study materials with AI-powered summaries and quizzes
          </p>
        </div>

        {/* Text Area */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Your Study Notes
            </label>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {text.length} characters
            </span>
          </div>
          <textarea
            className="w-full h-72 border-2 border-gray-200 rounded-xl p-5 text-gray-800 placeholder-gray-400 
                     focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 
                     transition-all duration-300 resize-none shadow-sm"
            placeholder="Paste or type your study notes, textbook content, or any learning material here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        {/* Action Button */}
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 
                   text-white py-4 rounded-xl font-semibold text-lg transition-all duration-300 
                   shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 
                   disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg flex items-center justify-center gap-3"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Processing Your Notes...
            </>
          ) : (
            <>
              <i className="fas fa-magic"></i>
              Generate Study Materials
            </>
          )}
        </button>

        {/* Features Grid - Compact */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-6 border-t border-gray-200">
  {[
    { icon: "file-alt", text: "AI Summaries", color: "from-blue-500 to-cyan-500" },
    { icon: "list-check", text: "Key Points", color: "from-green-500 to-emerald-500" },
    { icon: "question-circle", text: "Practice Quizzes", color: "from-purple-500 to-pink-500" }
  ].map((feature, index) => (
    <div key={index} className="group relative overflow-hidden rounded-xl bg-white p-4 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200">
      {/* Subtle background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-3 transition-opacity duration-300`}></div>
      
      <div className={`w-10 h-10 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-3 shadow-md group-hover:scale-105 transition-transform duration-200`}>
        <i className={`fas fa-${feature.icon} text-white text-sm`}></i>
      </div>
      
      <h3 className="font-semibold text-gray-800 text-base group-hover:text-gray-900 transition-colors">
        {feature.text}
      </h3>
    </div>
  ))}
</div>
      </div>
    </div>
  );
}
