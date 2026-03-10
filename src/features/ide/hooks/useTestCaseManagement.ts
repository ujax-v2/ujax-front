import { useState, useCallback } from 'react';
import type { IdeTestCase } from '@/store/atoms';

export function useTestCaseManagement() {
  const [testCases, setTestCases] = useState<IdeTestCase[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalInput, setModalInput] = useState('');
  const [modalExpected, setModalExpected] = useState('');

  const initTestCases = useCallback((cases: IdeTestCase[]) => {
    setTestCases(cases);
    if (cases.length > 0) setSelectedCaseId(cases[0].id);
  }, []);

  const openAddModal = useCallback(() => {
    setModalInput('');
    setModalExpected('');
    setShowAddModal(true);
  }, []);

  const confirmAddTestCase = useCallback(() => {
    const newCase: IdeTestCase = {
      id: `custom-${Date.now()}`,
      input: modalInput,
      expected: modalExpected,
      isCustom: true,
    };
    setTestCases((prev) => [...prev, newCase]);
    setSelectedCaseId(newCase.id);
    setShowAddModal(false);
  }, [modalInput, modalExpected]);

  const updateTestCase = useCallback((id: string, field: 'input' | 'expected', value: string) => {
    setTestCases((prev) => prev.map((tc) => tc.id === id ? { ...tc, [field]: value } : tc));
  }, []);

  const deleteTestCase = useCallback((id: string) => {
    setTestCases((prev) => {
      const next = prev.filter((tc) => tc.id !== id);
      if (selectedCaseId === id) {
        setSelectedCaseId(next.length > 0 ? next[0].id : null);
      }
      return next;
    });
  }, [selectedCaseId]);

  return {
    testCases,
    selectedCaseId,
    setSelectedCaseId,
    showAddModal,
    setShowAddModal,
    modalInput,
    setModalInput,
    modalExpected,
    setModalExpected,
    initTestCases,
    openAddModal,
    confirmAddTestCase,
    updateTestCase,
    deleteTestCase,
  };
}
