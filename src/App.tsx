import { useState, useEffect } from 'react';
import { useViewerStore } from './stores/viewerStore';
import Header from './components/Layout/Header';
import MachineryGrid from './components/Home/MachineryGrid';
import ViewerPage from './components/Viewer/ViewerPage';
import FlowchartPage from './components/Flowchart/FlowchartPage';
import ControlsHint from './components/UI/ControlsHint';

type Page = 'home' | 'viewer' | 'flowchart';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const { selectedMachinery, setSelectedMachinery } = useViewerStore();

  // Browser History Handling
  useEffect(() => {
    // Initial sync: Clear potentially stale persisted selection if at home
    if (currentPage === 'home') {
      setSelectedMachinery(null);
    }

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      if (state && state.page) {
        setCurrentPage(state.page);
        if (state.page === 'viewer' && state.machineryId) {
          setSelectedMachinery(state.machineryId);
        } else {
          setSelectedMachinery(null);
        }
      } else {
        // Default to home if no state
        setCurrentPage('home');
        setSelectedMachinery(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSelectMachinery = (id: string) => {
    console.log('🖱️ Machinery Selected:', id);
    setSelectedMachinery(id);
    setCurrentPage('viewer');
    window.history.pushState({ page: 'viewer', machineryId: id }, '', `#viewer/${id}`);
  };

  const handleBack = () => {
    setCurrentPage('home');
    setSelectedMachinery(null);
    window.history.pushState({ page: 'home' }, '', '/');
  };

  const handleFlowchart = () => {
    setCurrentPage('flowchart');
    window.history.pushState({ page: 'flowchart' }, '', '#flowchart');
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-50">
      <Header
        currentPage={currentPage}
        onBack={handleBack}
        onFlowchart={handleFlowchart}
        selectedMachinery={selectedMachinery}
      />

      <div className="flex-1 overflow-hidden relative">
        {currentPage === 'home' && (
          <MachineryGrid onSelect={handleSelectMachinery} />
        )}
        {currentPage === 'viewer' && selectedMachinery && (
          <>
            <ViewerPage machineryId={selectedMachinery} />
            <ControlsHint />
          </>
        )}
        {currentPage === 'flowchart' && (
          <FlowchartPage />
        )}
      </div>
    </div>
  );
}

export default App;
