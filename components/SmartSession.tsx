import React, { useState, useEffect } from 'react';
import { User, Subject, Chapter, LessonContent } from '../types';
import { fetchChapters, fetchLessonContent } from '../services/gemini';
import { getSubjectsList, DEFAULT_SUBJECTS } from '../constants';
import { Search, BookOpen, Video, FileText, CheckCircle, ArrowRight, X, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  user: User;
  onClose: () => void;
  onNavigateToContent: (content: LessonContent) => void;
}

export const SmartSession: React.FC<Props> = ({ isOpen, user, onClose, onNavigateToContent }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<LessonContent[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState('');

  // DEEP SEARCH ALGORITHM
  const handleSearch = async () => {
      if (!searchTerm.trim()) return;
      if (!['9','10','11','12'].includes(user.classLevel || '')) {
          setSearchStatus("Smart Session is optimized for Class 9-12.");
          return;
      }

      setIsSearching(true);
      setSearchStatus("Analyzing Syllabus...");
      setResults([]);

      const query = searchTerm.toLowerCase();
      const subjects = getSubjectsList(user.classLevel || '10', user.stream || 'Science');
      let foundItems: LessonContent[] = [];

      try {
          // 1. ITERATE ALL SUBJECTS
          for (const subject of subjects) {
              setSearchStatus(`Scanning ${subject.name}...`);
              
              // 2. FETCH CHAPTERS (Cache efficient)
              const chapters = await fetchChapters(user.board || 'CBSE', user.classLevel || '10', user.stream || 'Science', subject, 'English');
              
              // 3. FILTER MATCHING CHAPTERS
              const matchingChapters = chapters.filter(ch => ch.title.toLowerCase().includes(query) || (ch.description && ch.description.toLowerCase().includes(query)));

              // 4. FOR EACH MATCH, GENERATE/FETCH CONTENT PREVIEW
              // We don't want to generate full content for everything, just metadata.
              // We'll create "Virtual" LessonContent items.
              
              for (const ch of matchingChapters) {
                  // Push a virtual PDF Result
                  foundItems.push({
                      id: `pdf-${ch.id}`,
                      title: ch.title,
                      subtitle: `${subject.name} • Notes`,
                      content: '', // URL fetched on click
                      type: 'PDF_PREMIUM', // Default to Premium
                      dateCreated: new Date().toISOString(),
                      subjectName: subject.name
                  });

                  // Push a virtual Video Result
                  foundItems.push({
                      id: `vid-${ch.id}`,
                      title: ch.title,
                      subtitle: `${subject.name} • Lecture`,
                      content: '',
                      type: 'VIDEO_LECTURE',
                      dateCreated: new Date().toISOString(),
                      subjectName: subject.name
                  });
              }
          }

          setResults(foundItems);
          setSearchStatus(foundItems.length > 0 ? `Found ${foundItems.length} results` : `No topics found for "${searchTerm}" in Class ${user.classLevel} syllabus.`);

      } catch (e) {
          console.error(e);
          setSearchStatus("Search failed. Try again.");
      } finally {
          setIsSearching(false);
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[160] flex flex-col bg-slate-50 animate-in slide-in-from-bottom-4 duration-300">
        
        {/* HEADER */}
        <div className="bg-white p-4 shadow-sm border-b border-slate-200 safe-top flex items-center gap-4">
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100"><X size={24} /></button>
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <SparklesIcon /> Smart Session
            </h2>
        </div>

        {/* SEARCH BAR */}
        <div className="p-6">
            <div className="relative">
                <input 
                    type="text" 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search any topic (e.g. Thermodynamics)..."
                    className="w-full p-4 pl-12 rounded-2xl border-2 border-indigo-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-lg shadow-sm"
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" size={24} />
                {isSearching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-600 animate-spin" size={24} />}
            </div>
            <p className="text-center text-xs text-slate-400 mt-2 font-medium">{searchStatus}</p>
        </div>

        {/* RESULTS GRID */}
        <div className="flex-1 overflow-y-auto px-4 pb-20">
            {results.length > 0 ? (
                <div className="grid gap-3">
                    {results.map((item, idx) => (
                        <button 
                            key={idx}
                            onClick={() => onNavigateToContent(item)} // Pass "Virtual" item, Dashboard will load real content
                            className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${item.type.includes('VIDEO') ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                    {item.type.includes('VIDEO') ? <Video size={20} /> : <FileText size={20} />}
                                </div>
                                <div className="text-left">
                                    <h4 className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">{item.title}</h4>
                                    <p className="text-xs text-slate-500 font-medium">{item.subtitle}</p>
                                </div>
                            </div>
                            <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                        </button>
                    ))}
                </div>
            ) : (
                !isSearching && (
                    <div className="text-center py-20 opacity-50">
                        <BookOpen size={64} className="mx-auto text-slate-300 mb-4" />
                        <p className="font-bold text-slate-400">Search across your entire syllabus</p>
                        <p className="text-xs text-slate-300 mt-1">Physics • Chemistry • Math • Bio • SST</p>
                    </div>
                )
            )}
        </div>
    </div>
  );
};

const SparklesIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" fill="#6366f1" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);
