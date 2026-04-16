'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { X, Minus, Calculator } from 'lucide-react'
import { useCalculatorStore } from '@/store/calculatorStore'

const BUTTONS = [
  ['C', '±', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['0', '.', '='],
]

export default function FloatingCalculator() {
  const { isOpen, closeCalculator } = useCalculatorStore()

  const [display, setDisplay] = useState('0')
  const [prevValue, setPrevValue] = useState<number | null>(null)
  const [operator, setOperator] = useState<string | null>(null)
  const [waitingForOperand, setWaitingForOperand] = useState(false)
  const [minimized, setMinimized] = useState(false)

  const [position, setPosition] = useState({ x: 24, y: 80 })
  const dragging = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      dragging.current = true
      dragOffset.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      }
      e.preventDefault()
    },
    [position],
  )

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return
      const el = containerRef.current
      const w = el ? el.offsetWidth : 256
      const h = el ? el.offsetHeight : 400
      const rawX = e.clientX - dragOffset.current.x
      const rawY = e.clientY - dragOffset.current.y
      setPosition({
        x: Math.min(Math.max(0, rawX), window.innerWidth - w),
        y: Math.min(Math.max(0, rawY), window.innerHeight - h),
      })
    }
    const handleMouseUp = () => {
      dragging.current = false
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  const handleInput = (value: string) => {
    switch (value) {
      case 'C':
        setDisplay('0')
        setPrevValue(null)
        setOperator(null)
        setWaitingForOperand(false)
        break

      case '±':
        setDisplay(d => String(parseFloat(d) * -1))
        break

      case '%':
        setDisplay(d => String(parseFloat(d) / 100))
        break

      case '÷':
      case '×':
      case '−':
      case '+': {
        const current = parseFloat(display)
        if (prevValue !== null && operator && !waitingForOperand) {
          const result = calculate(prevValue, current, operator)
          setDisplay(formatResult(result))
          setPrevValue(result)
        } else {
          setPrevValue(current)
        }
        setOperator(value)
        setWaitingForOperand(true)
        break
      }

      case '=': {
        if (operator === null || prevValue === null) break
        const current = parseFloat(display)
        const result = calculate(prevValue, current, operator)
        setDisplay(formatResult(result))
        setPrevValue(null)
        setOperator(null)
        setWaitingForOperand(false)
        break
      }

      case '.':
        if (waitingForOperand) {
          setDisplay('0.')
          setWaitingForOperand(false)
          return
        }
        if (!display.includes('.')) {
          setDisplay(d => d + '.')
        }
        break

      default: {
        if (waitingForOperand) {
          setDisplay(value)
          setWaitingForOperand(false)
        } else {
          setDisplay(d => (d === '0' ? value : d.length >= 12 ? d : d + value))
        }
      }
    }
  }

  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+':
        return a + b
      case '−':
        return a - b
      case '×':
        return a * b
      case '÷':
        return b !== 0 ? a / b : 0
      default:
        return b
    }
  }

  const formatResult = (n: number): string => {
    if (!isFinite(n)) return 'Error'
    const str = parseFloat(n.toPrecision(10)).toString()
    return str
  }

  const isOperator = (v: string) => ['÷', '×', '−', '+'].includes(v)

  if (!isOpen) return null

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 9999,
        userSelect: 'none',
      }}
      className="shadow-2xl rounded-2xl overflow-hidden w-64 border border-[#002868]/20"
    >
      {/* Title bar - draggable */}
      <div
        onMouseDown={handleMouseDown}
        className="bg-[#002868] px-4 py-2 flex items-center justify-between cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-white/80" />
          <span className="text-white text-sm font-semibold select-none">Calculadora</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized(m => !m)}
            className="text-white/70 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
            aria-label="Minimizar"
          >
            <Minus className="w-3 h-3" />
          </button>
          <button
            onClick={closeCalculator}
            className="text-white/70 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {!minimized && (
        <div className="bg-[#1a1a2e]">
          {/* Display */}
          <div className="px-4 py-3 text-right">
            {operator && (
              <p className="text-[#8888aa] text-xs h-4">
                {prevValue} {operator}
              </p>
            )}
            {!operator && <p className="h-4" />}
            <p
              className="text-white font-light mt-1 overflow-hidden text-ellipsis"
              style={{ fontSize: display.length > 9 ? '1.25rem' : '1.75rem' }}
            >
              {display}
            </p>
          </div>

          {/* Buttons */}
          <div className="px-3 pb-3 grid gap-2">
            {BUTTONS.map((row, rowIdx) => (
              <div
                key={rowIdx}
                className={`grid gap-2 ${row.length === 3 ? 'grid-cols-[2fr_1fr_1fr]' : 'grid-cols-4'}`}
              >
                {row.map(btn => {
                  const isEq = btn === '='
                  const isOp = isOperator(btn)
                  const isTop = ['C', '±', '%'].includes(btn)
                  return (
                    <button
                      key={btn}
                      onClick={() => handleInput(btn)}
                      className={`
                        rounded-xl py-3 text-base font-medium transition-all active:scale-95
                        ${isEq ? 'bg-[#002868] text-white hover:bg-[#003d8f]' : ''}
                        ${isOp ? 'bg-[#002868]/70 text-white hover:bg-[#002868]' : ''}
                        ${isTop ? 'bg-[#3a3a4a] text-white hover:bg-[#4a4a5a]' : ''}
                        ${!isEq && !isOp && !isTop ? 'bg-[#2a2a3a] text-white hover:bg-[#3a3a4a]' : ''}
                      `}
                    >
                      {btn}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
