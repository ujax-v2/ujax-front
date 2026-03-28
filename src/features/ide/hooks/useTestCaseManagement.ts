import { useState, useCallback } from 'react';
import type { IdeTestCase } from '@/store/atoms';

type CustomCase = Pick<IdeTestCase, 'id' | 'input' | 'expected'>;

function loadCustomCases(storageKey: string): CustomCase[] {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
}

function saveCustomCases(storageKey: string, cases: IdeTestCase[]) {
  const custom = cases
    .filter((tc) => tc.isCustom)
    .map(({ id, input, expected }) => ({ id, input, expected }));
  localStorage.setItem(storageKey, JSON.stringify(custom));
}

export function useTestCaseManagement(customStorageKey: string) {
  const [testCases, setTestCases] = useState<IdeTestCase[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalInput, setModalInput] = useState('');
  const [modalExpected, setModalExpected] = useState('');

  const initTestCases = useCallback((cases: IdeTestCase[]) => {
    const saved = loadCustomCases(customStorageKey);
    const customCases: IdeTestCase[] = saved.map((c) => ({ ...c, isCustom: true }));
    const all = [...cases, ...customCases];
    setTestCases(all);
    if (all.length > 0) setSelectedCaseId(all[0].id);
  }, [customStorageKey]);

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
    setTestCases((prev) => {
      const next = [...prev, newCase];
      saveCustomCases(customStorageKey, next);
      return next;
    });
    setSelectedCaseId(newCase.id);
    setShowAddModal(false);
  }, [modalInput, modalExpected, customStorageKey]);

  const updateTestCase = useCallback((id: string, field: 'input' | 'expected', value: string) => {
    setTestCases((prev) => {
      const next = prev.map((tc) => tc.id === id ? { ...tc, [field]: value } : tc);
      saveCustomCases(customStorageKey, next);
      return next;
    });
  }, [customStorageKey]);

  const deleteTestCase = useCallback((id: string) => {
    setTestCases((prev) => {
      const next = prev.filter((tc) => tc.id !== id);
      if (selectedCaseId === id) {
        setSelectedCaseId(next.length > 0 ? next[0].id : null);
      }
      saveCustomCases(customStorageKey, next);
      return next;
    });
  }, [selectedCaseId, customStorageKey]);

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
