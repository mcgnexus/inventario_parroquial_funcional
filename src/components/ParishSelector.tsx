'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { GUADIX_PARISHES } from '@/data/guadixParishes'

type ParishOption = { id: string; name: string; location?: string }

interface ParishSelectorProps {
  value?: string
  onChange: (parishId: string) => void
  disabled?: boolean
  className?: string
}

export default function ParishSelector({
  value = '',
  onChange,
  disabled = false,
  className = ''
}: ParishSelectorProps) {
  const [parishOptions, setParishOptions] = useState<ParishOption[]>([])
  const [parishSelection, setParishSelection] = useState<string>('')
  const [parishSearch, setParishSearch] = useState<string>('')

  const isUuid = (str: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str)

  const normalize = (s: string) =>
    (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

  const mergeParishes = useCallback(
    (api: ParishOption[], fallback: { name: string; location?: string }[]): ParishOption[] => {
      const byKey = new Map<string, ParishOption>()
      for (const p of api) {
        const key = normalize(`${p.name}|${p.location || ''}`)
        byKey.set(key, {
          id: p.id || `${p.name}|${p.location || ''}`,
          name: p.name,
          location: p.location,
        })
      }
      for (const f of fallback) {
        const key = normalize(`${f.name}|${f.location || ''}`)
        if (!byKey.has(key)) {
          byKey.set(key, {
            id: `${f.name}|${f.location || ''}`,
            name: f.name,
            location: f.location,
          })
        }
      }
      const merged = Array.from(byKey.values())
      merged.sort((a, b) => normalize(a.name).localeCompare(normalize(b.name)))
      return merged
    },
    []
  )

  // Inicializar valor
  useEffect(() => {
    if (isUuid(value)) {
      setParishSelection(value)
      setParishSearch('')
    } else if (value) {
      setParishSelection('')
      setParishSearch(value)
    } else {
      setParishSelection('')
      setParishSearch('')
    }
  }, [value])

  // Cargar parroquias
  useEffect(() => {
    const loadParishes = async () => {
      try {
        const res = await fetch('/api/parishes/list?diocese=Guadix')
        const js = await res.json()
        const apiRows: ParishOption[] = res.ok && js?.ok ? js.parishes || [] : []
        setParishOptions(mergeParishes(apiRows, GUADIX_PARISHES))
      } catch {
        setParishOptions(mergeParishes([], GUADIX_PARISHES))
      }
    }
    loadParishes()
  }, [mergeParishes])

  // Auto-seleccionar coincidencia
  useEffect(() => {
    const term = normalize(parishSearch)
    if (!term) return
    const found = parishOptions.find(
      (opt) =>
        normalize(opt.name).includes(term) || normalize(opt.location || '').includes(term)
    )
    if (found) setParishSelection(found.id)
  }, [parishSearch, parishOptions])

  const handleSelectionChange = (selectedId: string) => {
    setParishSelection(selectedId)
    const selected = parishOptions.find((o) => o.id === selectedId)
    if (selected) {
      onChange(isUuid(selected.id) ? selected.id : selected.name)
    }
  }

  return (
    <div className={className}>
      <label className="block text-sm font-semibold text-slate-700 mb-1">Parroquia</label>

      {/* Buscador */}
      <input
        type="text"
        value={parishSearch}
        onChange={(e) => setParishSearch(e.target.value)}
        placeholder="Buscar por nombre o municipio (Guadix)"
        disabled={disabled}
        className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
      />

      {/* Selector */}
      <select
        value={parishSelection}
        onChange={(e) => handleSelectionChange(e.target.value)}
        disabled={disabled}
        className="mt-2 w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
      >
        <option value="">Selecciona parroquia (Guadix)</option>
        {parishOptions.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.name}
            {opt.location ? ` — ${opt.location}` : ''}
          </option>
        ))}
      </select>
    </div>
  )
}
