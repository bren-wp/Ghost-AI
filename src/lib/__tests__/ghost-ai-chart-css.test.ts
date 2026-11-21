// Ghost AI by Brendigo
import { describe, expect, it } from 'vitest'
import { safeChartIdentifier, safeChartColor } from '@/lib/ghost-ai-chart-css'

describe('Ghost AI chart CSS boundaries', () => {
  it('accepts normal chart theme colors', () => {
    expect(safeChartColor('#00e5ff')).toBe('#00e5ff')
    expect(safeChartColor('hsl(var(--chart-1))')).toBe('hsl(var(--chart-1))')
    expect(safeChartColor('rgb(20 30 40 / 80%)')).toBe('rgb(20 30 40 / 80%)')
    expect(safeChartColor('transparent')).toBe('transparent')
  })
  it('rejects style and remote resource injection', () => {
    expect(safeChartColor('red; background: url(https://evil.test/x)')).toBeNull()
    expect(safeChartColor('</style><script>bad()</script>')).toBeNull()
    expect(safeChartColor('url(/private)')).toBeNull()
    expect(safeChartColor({})).toBeNull()
  })
  it('keeps CSS selectors scoped to a safe chart identifier', () => {
    expect(safeChartIdentifier('basic-1')).toBe('basic-1')
    expect(safeChartIdentifier('bad] { color:red }')).toBe('badcolorred')
    expect(safeChartIdentifier('[]')).toBe('figure')
  })
})
