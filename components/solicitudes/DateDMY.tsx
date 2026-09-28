'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'

interface DateDMYProps {
  value: string
  onChange: (v: string) => void
}

export function DateDMY({ value, onChange }: DateDMYProps) {
  const [day, setDay] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')

  useEffect(() => {
    if (value) {
      const [y, m, d] = value.split('-')
      setYear(y || '')
      setMonth(m ? String(Number(m)) : '')
      setDay(d ? String(Number(d)) : '')
    } else {
      setDay('')
      setMonth('')
      setYear('')
    }
  }, [value])

  const commit = (d: string, m: string, y: string) => {
    if (d && m && y && y.length === 4) {
      onChange(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`)
    } else {
      onChange('')
    }
  }

  return (
    <div className="flex items-end gap-1.5">
      <div>
        <p className="text-[10px] text-[#9AA0AC] mb-0.5">Día</p>
        <Input
          type="number"
          min={1}
          max={31}
          placeholder="DD"
          className="h-10 w-16 text-center rounded-lg border-[#E0E0E0]"
          value={day}
          onChange={e => {
            setDay(e.target.value)
            commit(e.target.value, month, year)
          }}
        />
      </div>
      <span className="text-[#C0C0C0] pb-2.5 select-none">/</span>
      <div>
        <p className="text-[10px] text-[#9AA0AC] mb-0.5">Mes</p>
        <Input
          type="number"
          min={1}
          max={12}
          placeholder="MM"
          className="h-10 w-16 text-center rounded-lg border-[#E0E0E0]"
          value={month}
          onChange={e => {
            setMonth(e.target.value)
            commit(day, e.target.value, year)
          }}
        />
      </div>
      <span className="text-[#C0C0C0] pb-2.5 select-none">/</span>
      <div>
        <p className="text-[10px] text-[#9AA0AC] mb-0.5">Año</p>
        <Input
          type="number"
          min={2020}
          max={2100}
          placeholder="AAAA"
          className="h-10 w-24 text-center rounded-lg border-[#E0E0E0]"
          value={year}
          onChange={e => {
            setYear(e.target.value)
            commit(day, month, e.target.value)
          }}
        />
      </div>
    </div>
  )
}
