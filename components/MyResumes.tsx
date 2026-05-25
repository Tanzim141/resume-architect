import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../supabase';
import { FileText, Trash2, Edit, Loader2, ArrowLeft } from 'lucide-react';
import { UserInput, GeneratedResume } from '../types';

interface SavedResume {
  id: string;
  uid: string;
  personalInfo: UserInput;
  resumeData: GeneratedResume;
  createdAt: any;
}

interface MyResumesProps {
  onLoadResume: (id: string, personalInfo: UserInput, resumeData: GeneratedResume) => void;
  onCreateNew: () => void;
  onBack: () => void;
}

export const MyResumes: React.FC<MyResumesProps> = ({ onLoadResume, onCreateNew, onBack }) => {
  const { user } = useAuth();
  const [resumes, setResumes] = useState<SavedResume[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setResumes([]);
      setLoading(false);
      return;
    }

    const fetchResumes = async () => {
      try {
        const { data, error } = await supabase
          .from('resumes')
          .select('*')
          .eq('uid', user.id)
          .order('createdAt', { ascending: false });

        if (error) {
          console.error("Error fetching resumes:", error);
          setLoading(false);
          return;
        }

        setResumes(data as SavedResume[]);
        setLoading(false);
      } catch (err) {
        console.error("Unexpected error:", err);
        setLoading(false);
      }
    };

    fetchResumes();
  }, [user]);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      const { error } = await supabase
        .from('resumes')
        .delete()
        .eq('id', deletingId);
      
      if (error) throw error;
      
      setResumes(prev => prev.filter(r => r.id !== deletingId));
      setDeletingId(null);
    } catch (error) {
      console.error("Error deleting resume:", error);
    }
  };

  const cancelDelete = () => {
    setDeletingId(null);
  };

  const handleLoad = (resume: SavedResume) => {
    onLoadResume(resume.id, resume.personalInfo, resume.resumeData);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <button 
             onClick={onBack}
             className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
             <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">My Resumes</h2>
        </div>
        <button
          onClick={onCreateNew}
          className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Create New Resume
        </button>
      </div>

      {resumes.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
          <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-2">No resumes yet</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">Create your first professional resume now.</p>
          <button
            onClick={onCreateNew}
            className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Get Started
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resumes.map((resume) => (
            <div
              key={resume.id}
              onClick={() => handleLoad(resume)}
              className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="bg-sky-100 dark:bg-sky-900/30 p-3 rounded-lg text-sky-600 dark:text-sky-400">
                  <FileText className="w-6 h-6" />
                </div>
                <button
                  onClick={(e) => handleDeleteClick(resume.id, e)}
                  className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1"
                  title="Delete Resume"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-1 truncate" title={resume.personalInfo.jobTitle}>
                {resume.personalInfo.jobTitle || 'Untitled Resume'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-auto pt-4">
                Created: {new Date(resume.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Delete Resume?</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-6">This action cannot be undone. Are you sure you want to permanently delete this resume?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

