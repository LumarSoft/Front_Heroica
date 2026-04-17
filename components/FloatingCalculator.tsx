'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { X, Minus, Calculator, Copy, Check } from 'lucide-react'
import { useCalculatorStore } from '@/store/calculatorStore'

const BUTTONS = [
  ['C', '±', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['0', '.', '='],
]

const KEY_MAP: Record<string, string> = {
  '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
  '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
  '.': '.', ',': '.',
  '+': '+',
  '-': '−',
  '*': '×',
  '/': '÷',
  'Enter': '=',
  '=': '=',
  'Escape': 'C',
  '%': '%',
}

export default function FloatingCalculator() {
  const { isOpen, closeCalculator, toggleCalculator } = useCalculatorStore()

  const [display, setDisplay] = useState('0')
  const [prevValue, setPrevValue] = useState<number | null>(null)
  const [operator, setOperator] = useState<string | null>(null)
  const [waitingForOperand, setWaitingForOperand] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [copied, setCopied] = useState(false)

  const [position, setPosition] = useState({ x: 24, y: 80 })
  const dragging = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  // Refs to always access latest state in event listeners without stale closures
  const displayRef = useRef(display)
  const prevValueRef = useRef(prevValue)
  const operatorRef = useRef(operator)
  const waitingForOperandRef = useRef(waitingForOperand)

  useEffect(() => { displayRef.current = display }, [display])
  useEffect(() => { prevValueRef.current = prevValue }, [prevValue])
  useEffect(() => { operatorRef.current = operator }, [operator])
  useEffect(() => { waitingForOperandRef.current = waitingForOperand }, [waitingForOperand])

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
    const handleMouseUp = () => { dragging.current = false }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+': return a + b
      case '−': return a - b
      case '×': return a * b
      case '÷': return b !== 0 ? a / b : 0
      default: return b
    }
  }

  const formatResult = (n: number): string => {
    if (!isFinite(n)) return 'Error'
    return parseFloat(n.toPrecision(10)).toString()
  }

  // Core input handler using refs to avoid stale closures when called from keyboard listeners
  const handleInputWithRefs = useCallback((value: string) => {
    const currentDisplay = displayRef.current
    const currentPrevValue = prevValueRef.current
    const currentOperator = operatorRef.current
    const currentWaiting = waitingForOperandRef.current

    switch (value) {
      case 'C':
        setDisplay('0')
        setPrevValue(null)
        setOperator(null)
        setWaitingForOperand(false)
        break

      case '±':
        setDisplay(String(parseFloat(currentDisplay) * -1))
        break

      case '%':
        setDisplay(String(parseFloat(currentDisplay) / 100))
        break

      case '÷':
      case '×':
      case '−':
      case '+': {
        const current = parseFloat(currentDisplay)
        if (currentPrevValue !== null && currentOperator && !currentWaiting) {
          const result = calculate(currentPrevValue, current, currentOperator)
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
        if (currentOperator === null || currentPrevValue === null) break
        const current = parseFloat(currentDisplay)
        const result = calculate(currentPrevValue, current, currentOperator)
        setDisplay(formatResult(result))
        setPrevValue(null)
        setOperator(null)
        setWaitingForOperand(false)
        break
      }

      case '.':
        if (currentWaiting) {
          setDisplay('0.')
          setWaitingForOperand(false)
          return
        }
        if (!currentDisplay.includes('.')) {
          setDisplay(d => d + '.')
        }
        break

      default: {
        if (currentWaiting) {
          setDisplay(value)
          setWaitingForOperand(false)
        } else {
          setDisplay(d => (d === '0' ? value : d.length >= 12 ? d : d + value))
        }
      }
    }
  }, [])

  // handleInput alias for button clicks (same function)
  const handleInput = handleInputWithRefs

  // Global F1 shortcut to toggle the calculator from anywhere
  useEffect(() => {
    const handleF1 = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault()
        toggleCalculator()
      }
    }
    window.addEventListener('keydown', handleF1)
    return () => window.removeEventListener('keydown', handleF1)
  }, [toggleCalculator])

  // Keyboard input when calculator is open
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in a form field
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) return

      // Copy display value: Ctrl+C / Cmd+C
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault()
        navigator.clipboard.writeText(displayRef.current).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        })
        return
      }

      // Backspace: delete last digit
      if (e.key === 'Backspace') {
        e.preventDefault()
        setDisplay(d => {
          if (d === 'Error') return '0'
          if (d.length <= 1 || (d.length === 2 && d.startsWith('-'))) return '0'
          return d.slice(0, -1)
        })
        return
      }

      const mapped = KEY_MAP[e.key]
      if (mapped) {
        e.preventDefault()
        handleInputWithRefs(mapped)
      }
    }

    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) return

      e.preventDefault()
      const text = e.clipboardData?.getData('text') ?? ''
      const cleaned = text.trim().replace(',', '.')
      const num = parseFloat(cleaned)
      if (!isNaN(num)) {
        setDisplay(formatResult(num))
        setWaitingForOperand(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('paste', handlePaste)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('paste', handlePaste)
    }
  }, [isOpen, handleInputWithRefs])

  const handleCopyDisplay = () => {
    navigator.clipboard.writeText(display).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
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
      }}
      className="shadow-2xl rounded-2xl overflow-hidden w-64 border border-[#002868]/20"
    >
      {/* Title bar - draggable */}
      <div
        onMouseDown={handleMouseDown}
        style={{ userSelect: 'none' }}
        className="bg-[#002868] px-4 py-2 flex items-center justify-between cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-white/80" />
          <span className="text-white text-sm font-semibold">Calculadora</span>
          <span className="text-white/40 text-xs">F1</span>
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
            <div className="flex items-center justify-end gap-2 mt-1">
              <button
                onClick={handleCopyDisplay}
                className="text-[#8888aa] hover:text-white transition-colors p-1 rounded"
                title="Copiar (Ctrl+C)"
                aria-label="Copiar valor"
              >
                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              </button>
              <p
                className="text-white font-light overflow-hidden text-ellipsis cursor-text select-text"
                style={{ fontSize: display.length > 9 ? '1.25rem' : '1.75rem' }}
                title="Ctrl+C para copiar · Ctrl+V para pegar"
              >
                {display}
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="px-3 pb-3 grid gap-2" style={{ userSelect: 'none' }}>
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
