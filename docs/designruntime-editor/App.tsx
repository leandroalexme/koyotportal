import React, { useState } from 'react';
import { DesignDocument } from './types';
import { Dashboard } from './components/Dashboard';
import { Editor } from './components/Editor';
import { TemplateDomain } from './domains/templates/TemplateService';

type View = 'DASHBOARD' | 'EDITOR';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('DASHBOARD');
  const [activeDocument, setActiveDocument] = useState<DesignDocument | null>(null);

  const handleOpenTemplate = (templateId: string) => {
    try {
        const doc = TemplateDomain.createDocumentFromTemplate(templateId);
        setActiveDocument(doc);
        setCurrentView('EDITOR');
    } catch (e) {
        console.error("Failed to load template", e);
        alert("Failed to load template.");
    }
  };

  const handleBackToDashboard = () => {
    // Determine if we should save/prompt? 
    // Autosave is handled inside Editor, so we can just switch.
    setCurrentView('DASHBOARD');
    setActiveDocument(null);
  };

  if (currentView === 'EDITOR' && activeDocument) {
      return (
          <Editor 
              initialDocument={activeDocument} 
              onBack={handleBackToDashboard}
          />
      );
  }

  return <Dashboard onOpenTemplate={handleOpenTemplate} />;
}