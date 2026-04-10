/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Database, 
  TreePine, 
  FileText, 
  ChevronRight, 
  X, 
  Info,
  Download,
  Tag,
  LayoutGrid,
  List
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RegistryData, Tree } from './types';

const DATA_URL = 'https://raw.githubusercontent.com/ryandkuster/test_data/main/registry.json';

export default function App() {
  const [registryData, setRegistryData] = useState<RegistryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<string>('all');
  const [selectedSite, setSelectedSite] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedDataType, setSelectedDataType] = useState<string>('all');
  const [selectedTree, setSelectedTree] = useState<Tree | null>(null);
  const [activeTab, setActiveTab] = useState<'explorer' | 'projects' | 'generator'>('explorer');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Tag Generator State
  const [genSpecies, setGenSpecies] = useState('');
  const [genSite, setGenSite] = useState('');
  const [genTissue, setGenTissue] = useState('');
  const [genProject, setGenProject] = useState('');

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("Fetching from:", DATA_URL);
        const response = await fetch(DATA_URL);
        if (!response.ok) {
          throw new Error(`Network response was not ok (Status: ${response.status} ${response.statusText})`);
        }
        const data = await response.json();
        
        // Basic validation
        if (!data || typeof data !== 'object' || !data.trees || !data.projects || !data.controlled_vocab) {
          throw new Error("The remote file was found but the data structure is invalid. Please ensure it follows the BioRegistry schema.");
        }
        
        setRegistryData(data);
      } catch (e) {
        console.error("Registry Fetch Error:", e);
        setError(e instanceof Error ? e.message : "An unknown error occurred while fetching the registry.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const generatedTags = useMemo(() => {
    const tags = [];
    if (genProject) tags.push(genProject);
    if (genSpecies) tags.push(genSpecies);
    if (genSite) tags.push(genSite.replace(/\s+/g, '_'));
    if (genTissue) tags.push(genTissue);
    return tags;
  }, [genSpecies, genSite, genTissue, genProject]);

  // Filtering logic
  const filteredTrees = useMemo(() => {
    if (!registryData) return [];
    return registryData.trees.filter(tree => {
      const matchesSearch = 
        tree.sample_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tree.uid.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesSpecies = selectedSpecies === 'all' || tree.species_code === selectedSpecies;
      const matchesSite = selectedSite === 'all' || tree.site === selectedSite;
      const matchesProject = selectedProject === 'all' || tree.project_code === selectedProject;
      const matchesDataType = selectedDataType === 'all' || tree.data_types.includes(selectedDataType);

      return matchesSearch && matchesSpecies && matchesSite && matchesProject && matchesDataType;
    });
  }, [searchQuery, selectedSpecies, selectedSite, selectedProject, selectedDataType, registryData]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedSpecies('all');
    setSelectedSite('all');
    setSelectedProject('all');
    setSelectedDataType('all');
  };

  const exportToTSV = () => {
    if (!registryData) return;
    const headers = ["UID", "Sample Name", "Species", "Site", "Project", "Data Types", "Location"];
    const rows = filteredTrees.map(tree => [
      tree.uid,
      tree.sample_name,
      tree.species_code,
      tree.site,
      tree.project_code,
      tree.data_types.join(', '),
      tree.location
    ]);

    const tsvContent = [
      headers.join('\t'),
      ...rows.map(row => row.join('\t'))
    ].join('\n');

    const blob = new Blob([tsvContent], { type: 'text/tab-separated-values;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `bioregistry_export_${new Date().toISOString().split('T')[0]}.tsv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* Header */}
      <header className="border-b border-[#141414] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif italic tracking-tight flex items-center gap-2">
            <Database className="w-8 h-8" />
            BioRegistry
          </h1>
          <p className="text-xs font-mono opacity-60 mt-1 uppercase tracking-widest">
            Sample & Metadata Explorer / v1.0.4
          </p>
        </div>
        
        <nav className="flex gap-1 bg-[#141414]/5 p-1 border border-[#141414]">
          <button 
            onClick={() => setActiveTab('explorer')}
            className={`px-4 py-2 text-[10px] font-mono uppercase transition-colors ${activeTab === 'explorer' ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-[#141414]/10'}`}
          >
            Explorer
          </button>
          <button 
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-2 text-[10px] font-mono uppercase transition-colors ${activeTab === 'projects' ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-[#141414]/10'}`}
          >
            Projects
          </button>
          <button 
            onClick={() => setActiveTab('generator')}
            className={`px-4 py-2 text-[10px] font-mono uppercase transition-colors ${activeTab === 'generator' ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-[#141414]/10'}`}
          >
            Tag Generator
          </button>
        </nav>

          <div className="hidden xl:flex gap-8">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-mono opacity-50 uppercase">Total Samples</span>
              <span className="text-2xl font-mono leading-none">{registryData ? registryData.trees.length : '--'}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-mono opacity-50 uppercase">Active Projects</span>
              <span className="text-2xl font-mono leading-none">{registryData ? registryData.projects.length : '--'}</span>
            </div>
          </div>
      </header>

      <main className="p-6 max-w-[1600px] mx-auto min-h-[70vh]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="w-12 h-12 border-4 border-[#141414] border-t-transparent rounded-full animate-spin"></div>
            <p className="font-mono text-xs uppercase tracking-widest opacity-60">Fetching Remote Registry...</p>
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto p-8 border border-red-500 bg-red-50 text-red-900 text-center space-y-4">
            <Info className="w-12 h-12 mx-auto opacity-50" />
            <h2 className="text-xl font-serif italic">Connection Error</h2>
            <p className="text-sm font-mono">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-900 text-white font-mono text-[10px] uppercase tracking-widest"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'explorer' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Sidebar / Filters */}
                <aside className="lg:col-span-3 space-y-8">
                  <section>
                    <h2 className="text-[11px] font-serif italic opacity-50 uppercase tracking-widest mb-4 border-b border-[#141414]/20 pb-2">
                      Search Registry
                    </h2>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                      <input 
                        type="text" 
                        placeholder="UID or Sample Name..."
                        className="w-full bg-transparent border border-[#141414] p-3 pl-10 focus:outline-none focus:ring-1 focus:ring-[#141414] font-mono text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </section>

                  <section className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-[11px] font-serif italic opacity-50 uppercase tracking-widest border-b border-[#141414]/20 pb-2 flex-grow">
                        Ontological Filters
                      </h2>
                      <button 
                        onClick={resetFilters}
                        className="text-[10px] font-mono hover:underline ml-4"
                      >
                        [RESET]
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-mono opacity-60 block mb-1 uppercase">Species</label>
                        <select 
                          className="w-full bg-transparent border border-[#141414] p-2 text-sm focus:outline-none"
                          value={selectedSpecies}
                          onChange={(e) => setSelectedSpecies(e.target.value)}
                        >
                          <option value="all">All Species</option>
                          {registryData.controlled_vocab.species.map(s => (
                            <option key={s.code} value={s.code}>{s.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-mono opacity-60 block mb-1 uppercase">Site Location</label>
                        <select 
                          className="w-full bg-transparent border border-[#141414] p-2 text-sm focus:outline-none"
                          value={selectedSite}
                          onChange={(e) => setSelectedSite(e.target.value)}
                        >
                          <option value="all">All Sites</option>
                          {registryData.controlled_vocab.sites.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-mono opacity-60 block mb-1 uppercase">Project</label>
                        <select 
                          className="w-full bg-transparent border border-[#141414] p-2 text-sm focus:outline-none"
                          value={selectedProject}
                          onChange={(e) => setSelectedProject(e.target.value)}
                        >
                          <option value="all">All Projects</option>
                          {registryData.projects.map(p => (
                            <option key={p.code} value={p.code}>{p.code} - {p.description}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-mono opacity-60 block mb-1 uppercase">Data Type</label>
                        <select 
                          className="w-full bg-transparent border border-[#141414] p-2 text-sm focus:outline-none"
                          value={selectedDataType}
                          onChange={(e) => setSelectedDataType(e.target.value)}
                        >
                          <option value="all">All Types</option>
                          {registryData.controlled_vocab.data_types.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </section>

                  <section className="p-4 border border-dashed border-[#141414]/30 bg-[#141414]/5">
                    <h3 className="text-[11px] font-mono font-bold uppercase mb-2 flex items-center gap-2">
                      <Info className="w-3 h-3" />
                      Remote Registry
                    </h3>
                    <p className="text-xs leading-relaxed opacity-70">
                      This application is pulling live data from:
                      <code className="block mt-2 bg-[#141414]/10 p-2 text-[10px] break-all">
                        {DATA_URL}
                      </code>
                    </p>
                  </section>
                </aside>

                {/* Results Area */}
                <div className="lg:col-span-9 space-y-6">
                  <div className="flex items-center justify-between border-b border-[#141414] pb-4">
                    <div className="flex items-center gap-4">
                      <h2 className="text-xl font-serif italic">Query Results</h2>
                      <span className="text-xs font-mono opacity-50">[{filteredTrees.length} matches]</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={exportToTSV}
                        title="Export Results to TSV"
                        className="flex items-center gap-2 px-3 py-2 border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors text-[10px] font-mono uppercase"
                      >
                        <Download className="w-3 h-3" />
                        Export TSV
                      </button>
                      <div className="w-px h-6 bg-[#141414]/20 mx-1"></div>
                      <button 
                        onClick={() => setViewMode('table')}
                        className={`p-2 border border-[#141414] ${viewMode === 'table' ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-[#141414]/10'}`}
                      >
                        <List className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setViewMode('grid')}
                        className={`p-2 border border-[#141414] ${viewMode === 'grid' ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-[#141414]/10'}`}
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {viewMode === 'table' ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-[#141414]">
                            <th className="text-left py-3 px-4 text-[11px] font-serif italic opacity-50 uppercase tracking-widest">UID</th>
                            <th className="text-left py-3 px-4 text-[11px] font-serif italic opacity-50 uppercase tracking-widest">Sample Name</th>
                            <th className="text-left py-3 px-4 text-[11px] font-serif italic opacity-50 uppercase tracking-widest">Species</th>
                            <th className="text-left py-3 px-4 text-[11px] font-serif italic opacity-50 uppercase tracking-widest">Site</th>
                            <th className="text-left py-3 px-4 text-[11px] font-serif italic opacity-50 uppercase tracking-widest">Data Types</th>
                            <th className="text-right py-3 px-4 text-[11px] font-serif italic opacity-50 uppercase tracking-widest">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTrees.map(tree => (
                            <tr 
                              key={tree.uid}
                              onClick={() => setSelectedTree(tree)}
                              className="border-b border-[#141414]/10 hover:bg-[#141414] hover:text-[#E4E3E0] cursor-pointer transition-colors group"
                            >
                              <td className="py-4 px-4 font-mono text-sm">{tree.uid}</td>
                              <td className="py-4 px-4 font-medium">{tree.sample_name}</td>
                              <td className="py-4 px-4 text-sm opacity-80">{tree.species_code}</td>
                              <td className="py-4 px-4 text-sm opacity-80">{tree.site}</td>
                              <td className="py-4 px-4">
                                <div className="flex flex-wrap gap-1">
                                  {tree.data_types.map(dt => (
                                    <span key={dt} className="text-[9px] font-mono border border-current px-1 uppercase">{dt}</span>
                                  ))}
                                </div>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <ChevronRight className="w-4 h-4 inline-block opacity-0 group-hover:opacity-100 transition-opacity" />
                              </td>
                            </tr>
                          ))}
                          {filteredTrees.length === 0 && (
                            <tr>
                              <td colSpan={6} className="py-20 text-center opacity-40 font-serif italic">
                                No samples match your current query parameters.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {filteredTrees.map(tree => (
                        <motion.div 
                          layout
                          key={tree.uid}
                          onClick={() => setSelectedTree(tree)}
                          className="border border-[#141414] p-6 hover:bg-[#141414] hover:text-[#E4E3E0] cursor-pointer transition-colors group relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20">
                            <TreePine className="w-24 h-24 -mr-8 -mt-8" />
                          </div>
                          <div className="relative z-10">
                            <span className="text-[10px] font-mono opacity-50 uppercase block mb-1">{tree.uid}</span>
                            <h3 className="text-xl font-serif italic mb-4">{tree.sample_name}</h3>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between border-b border-current/10 pb-1">
                                <span className="opacity-60">Species</span>
                                <span>{tree.species_code}</span>
                              </div>
                              <div className="flex justify-between border-b border-current/10 pb-1">
                                <span className="opacity-60">Site</span>
                                <span>{tree.site}</span>
                              </div>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                              {tree.data_types.map(dt => (
                                <span key={dt} className="text-[10px] font-mono border border-current px-2 py-0.5 uppercase">{dt}</span>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'projects' && (
              <div className="space-y-8">
                <div className="border-b border-[#141414] pb-4">
                  <h2 className="text-2xl font-serif italic">Active Research Projects</h2>
                  <p className="text-xs font-mono opacity-50 uppercase tracking-widest mt-1">Directory of all registered research initiatives</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {registryData.projects.map(project => (
                    <div key={project.code} className="border border-[#141414] p-8 bg-white/30 hover:bg-white/50 transition-colors">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <span className="text-[10px] font-mono bg-[#141414] text-[#E4E3E0] px-2 py-0.5 uppercase">{project.code}</span>
                          <h3 className="text-2xl font-serif italic mt-2">{project.description}</h3>
                        </div>
                        <FileText className="w-8 h-8 opacity-20" />
                      </div>
                      <div className="space-y-4">
                        <div>
                          <span className="text-[10px] font-mono opacity-50 uppercase block mb-1">Lead Group</span>
                          <span className="text-sm font-medium">{project.lead_group}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono opacity-50 uppercase block mb-1">Expected Data Types</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {project.dtypes.map(dt => (
                              <span key={dt} className="text-[10px] font-mono border border-[#141414] px-2 py-0.5 uppercase">{dt}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'generator' && (
              <div className="max-w-4xl mx-auto space-y-12">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-serif italic">Ontological Tag Generator</h2>
                  <p className="text-sm opacity-60">Determine the correct metadata tags for your new samples based on the controlled vocabulary.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                  <div className="space-y-6 bg-white/30 p-8 border border-[#141414]">
                    <h3 className="text-[11px] font-mono font-bold uppercase border-b border-[#141414]/20 pb-2">Sample Parameters</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-mono opacity-60 block mb-1 uppercase">Project Context</label>
                        <select 
                          className="w-full bg-transparent border border-[#141414] p-3 text-sm focus:outline-none"
                          value={genProject}
                          onChange={(e) => setGenProject(e.target.value)}
                        >
                          <option value="">Select Project...</option>
                          {registryData.projects.map(p => (
                            <option key={p.code} value={p.code}>{p.code}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-mono opacity-60 block mb-1 uppercase">Species</label>
                        <select 
                          className="w-full bg-transparent border border-[#141414] p-3 text-sm focus:outline-none"
                          value={genSpecies}
                          onChange={(e) => setGenSpecies(e.target.value)}
                        >
                          <option value="">Select Species...</option>
                          {registryData.controlled_vocab.species.map(s => (
                            <option key={s.code} value={s.code}>{s.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-mono opacity-60 block mb-1 uppercase">Collection Site</label>
                        <select 
                          className="w-full bg-transparent border border-[#141414] p-3 text-sm focus:outline-none"
                          value={genSite}
                          onChange={(e) => setGenSite(e.target.value)}
                        >
                          <option value="">Select Site...</option>
                          {registryData.controlled_vocab.sites.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-mono opacity-60 block mb-1 uppercase">Tissue Type</label>
                        <select 
                          className="w-full bg-transparent border border-[#141414] p-3 text-sm focus:outline-none"
                          value={genTissue}
                          onChange={(e) => setGenTissue(e.target.value)}
                        >
                          <option value="">Select Tissue...</option>
                          {registryData.controlled_vocab.tissue_types.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-[11px] font-mono font-bold uppercase border-b border-[#141414]/20 pb-2">Generated Tag String</h3>
                    
                    <div className="p-8 border border-[#141414] bg-[#141414] text-[#E4E3E0] min-h-[200px] flex flex-col justify-center items-center text-center">
                      {generatedTags.length > 0 ? (
                        <>
                          <div className="text-2xl font-mono tracking-tighter break-all">
                            {generatedTags.join('::')}
                          </div>
                          <p className="mt-4 text-[10px] font-mono opacity-40 uppercase">Copy this string for your metadata file</p>
                        </>
                      ) : (
                        <p className="text-xs font-mono opacity-40 italic">Select parameters to generate tags...</p>
                      )}
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[10px] font-mono opacity-50 uppercase">Individual Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {generatedTags.map(tag => (
                          <span key={tag} className="flex items-center gap-1 text-xs font-mono border border-[#141414] px-3 py-1.5 uppercase bg-white">
                            <Tag className="w-3 h-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedTree && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTree(null)}
              className="absolute inset-0 bg-[#141414]/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-[#E4E3E0] border border-[#141414] w-full max-w-3xl overflow-hidden shadow-2xl"
            >
              <div className="flex justify-between items-center p-6 border-b border-[#141414]">
                <div className="flex items-center gap-3">
                  <div className="bg-[#141414] text-[#E4E3E0] p-2">
                    <TreePine className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-serif italic">{selectedTree.sample_name}</h2>
                    <p className="text-xs font-mono opacity-60 uppercase">{selectedTree.uid}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedTree(null)}
                  className="p-2 hover:bg-[#141414]/10 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <section>
                    <h3 className="text-[11px] font-mono font-bold uppercase mb-4 border-b border-[#141414]/20 pb-1">Metadata</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[10px] font-mono opacity-50 uppercase block">Species Code</span>
                          <span className="text-sm font-medium">{selectedTree.species_code}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono opacity-50 uppercase block">Site Location</span>
                          <span className="text-sm font-medium">{selectedTree.site}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono opacity-50 uppercase block">Project Code</span>
                        <span className="text-sm font-medium">{selectedTree.project_code}</span>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-[11px] font-mono font-bold uppercase mb-4 border-b border-[#141414]/20 pb-1">Data Assets</h3>
                    <div className="space-y-3">
                      {selectedTree.data_types.map(dt => (
                        <div key={dt} className="flex items-center gap-3 p-3 border border-[#141414]/10 bg-white/50">
                          <FileText className="w-4 h-4 opacity-40" />
                          <span className="text-sm font-mono">{dt}</span>
                          <span className="ml-auto text-[10px] font-mono bg-[#141414] text-[#E4E3E0] px-2 py-0.5">READY</span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                <div className="space-y-8">
                  <section>
                    <h3 className="text-[11px] font-mono font-bold uppercase mb-4 border-b border-[#141414]/20 pb-1">Storage Location</h3>
                    <div className="p-4 bg-[#141414] text-[#E4E3E0] font-mono text-xs break-all leading-relaxed">
                      {selectedTree.location}
                    </div>
                    <button className="mt-4 w-full border border-[#141414] p-3 text-xs font-mono uppercase flex items-center justify-center gap-2 hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors">
                      <Download className="w-4 h-4" />
                      Request Access
                    </button>
                  </section>

                  <section>
                    <h3 className="text-[11px] font-mono font-bold uppercase mb-4 border-b border-[#141414]/20 pb-1">Ontology Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="flex items-center gap-1 text-[10px] font-mono border border-[#141414] px-2 py-1 uppercase">
                        <Tag className="w-3 h-3" />
                        {selectedTree.species_code}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-mono border border-[#141414] px-2 py-1 uppercase">
                        <Tag className="w-3 h-3" />
                        {selectedTree.site.replace(' ', '_')}
                      </span>
                      {selectedTree.data_types.map(dt => (
                        <span key={dt} className="flex items-center gap-1 text-[10px] font-mono border border-[#141414] px-2 py-1 uppercase">
                          <Tag className="w-3 h-3" />
                          {dt}
                        </span>
                      ))}
                    </div>
                  </section>
                </div>
              </div>

              <div className="bg-[#141414]/5 p-6 border-t border-[#141414]">
                <p className="text-[10px] font-mono opacity-50 text-center uppercase tracking-widest">
                  End of Record / UID: {selectedTree.uid}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-[#141414] p-8 mt-12 bg-[#141414] text-[#E4E3E0]">
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <h4 className="text-xl font-serif italic mb-4">BioRegistry</h4>
            <p className="text-sm opacity-60 leading-relaxed">
              A collaborative metadata management system designed for distributed research groups. Built on the registry-interface pattern.
            </p>
          </div>
          <div>
            <h5 className="text-[11px] font-mono font-bold uppercase mb-4 opacity-50 tracking-widest">System Info</h5>
            <ul className="space-y-2 text-xs font-mono">
              <li className="flex justify-between"><span>Registry Source</span> <span className="opacity-60">GitHub Remote</span></li>
              <li className="flex justify-between"><span>Last Sync</span> <span className="opacity-60">{new Date().toISOString().split('T')[0]}</span></li>
              <li className="flex justify-between"><span>CORS Status</span> <span className="opacity-60 text-green-400">REMOTE_OK</span></li>
            </ul>
          </div>
          <div>
            <h5 className="text-[11px] font-mono font-bold uppercase mb-4 opacity-50 tracking-widest">Collaborators</h5>
            <div className="flex flex-wrap gap-2">
              {['Forestry', 'Ecology', 'Genomics', 'Agri-Data'].map(group => (
                <span key={group} className="text-[10px] font-mono border border-current/30 px-2 py-1 uppercase">{group}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-white/10 text-center">
          <p className="text-[10px] font-mono opacity-30 uppercase tracking-[0.3em]">
            &copy; 2026 BioRegistry Open Metadata Initiative
          </p>
        </div>
      </footer>
    </div>
  );
}
