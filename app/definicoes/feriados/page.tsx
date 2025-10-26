'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Plus,
  Trash2,
  X,
  Loader2,
  Edit,
  RotateCw,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'

interface Feriado {
  id: string
  holiday_date: string
  description: string
  created_at: string
  updated_at: string
}

export default function FeriadosPage() {
  const [feriados, setFeriados] = useState<Feriado[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDescription, setEditDescription] = useState('')
  const [editDate, setEditDate] = useState<string>('')
  const [descriptionFilter, setDescriptionFilter] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sortColumn, setSortColumn] = useState<'holiday_date' | 'description'>(
    'holiday_date',
  )
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [debouncedDescriptionFilter, setDebouncedDescriptionFilter] =
    useState(descriptionFilter)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedDescriptionFilter(descriptionFilter)
    }, 300)
    return () => clearTimeout(timer)
  }, [descriptionFilter])

  const supabase = createClient()

  const fetchFeriados = useCallback(
    async (filters: { descriptionFilter?: string } = {}) => {
      setLoading(true)
      try {
        let query = supabase.from('feriados').select('*')

        if (filters.descriptionFilter?.trim?.()) {
          query = query.ilike(
            'description',
            `%${filters.descriptionFilter.trim()}%`,
          )
        }

        const ascending = sortDirection === 'asc'
        if (sortColumn === 'holiday_date') {
          query = query.order('holiday_date', { ascending })
        } else {
          query = query.order('description', { ascending })
        }

        const { data, error } = await query

        if (!error && data) {
          setFeriados(data)
        }
      } catch (error) {
        console.error('Error fetching feriados:', error)
      } finally {
        setLoading(false)
      }
    },
    [supabase, sortColumn, sortDirection],
  )

  useEffect(() => {
    fetchFeriados()
  }, [fetchFeriados])

  useEffect(() => {
    fetchFeriados({ descriptionFilter: debouncedDescriptionFilter })
  }, [debouncedDescriptionFilter, fetchFeriados])

  useEffect(() => {
    fetchFeriados({ descriptionFilter: debouncedDescriptionFilter })
  }, [sortColumn, sortDirection, debouncedDescriptionFilter, fetchFeriados])

  const sortedFeriados = feriados

  const handleSort = (column: 'holiday_date' | 'description') => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const handleAddNew = async () => {
    const description = prompt('Digite a descrição do feriado:')
    if (!description?.trim()) return

    const dateStr = prompt('Digite a data (YYYY-MM-DD):')
    if (!dateStr?.trim()) return

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(dateStr)) {
      alert('Formato de data inválido. Use YYYY-MM-DD')
      return
    }

    setSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('feriados')
        .insert({
          holiday_date: dateStr,
          description: description.trim(),
        })
        .select('*')

      if (!error && data && data[0]) {
        setFeriados((prev) => [...prev, data[0]])
      }
    } catch (error) {
      console.error('Error creating feriado:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este feriado?')) return

    try {
      const { error } = await supabase.from('feriados').delete().eq('id', id)

      if (!error) {
        setFeriados((prev) => prev.filter((f) => f.id !== id))
      }
    } catch (error) {
      console.error('Error deleting feriado:', error)
    }
  }

  const formatDisplayDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, 'dd/MM/yyyy', { locale: pt })
    } catch {
      return dateString
    }
  }

  const handleSave = async (id: string) => {
    if (!editDescription.trim() || !editDate) return

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('feriados')
        .update({
          holiday_date: editDate,
          description: editDescription.trim(),
          updated_at: new Date().toISOString().split('T')[0],
        })
        .eq('id', id)

      if (!error) {
        setFeriados((prev) =>
          prev.map((f) =>
            f.id === id
              ? {
                  ...f,
                  holiday_date: editDate,
                  description: editDescription.trim(),
                }
              : f,
          ),
        )
      }
    } catch (error) {
      console.error('Error updating:', error)
    } finally {
      setSubmitting(false)
      setEditingId(null)
      setEditDescription('')
      setEditDate('')
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditDescription('')
    setEditDate('')
  }

  return (
    <div className="w-full space-y-6 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestão de Feriados</h1>
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => fetchFeriados()}
                  className="h-10 w-10 p-0"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Atualizar</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleAddNew}
                  className="h-10 w-10 p-0"
                  size="icon"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Novo feriado</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Filtrar por descrição..."
          value={descriptionFilter}
          onChange={(e) => setDescriptionFilter(e.target.value)}
          className="h-10 w-[300px]"
        />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setDescriptionFilter('')}
                className="h-10 w-10 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Limpar filtro</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  fetchFeriados({
                    descriptionFilter: debouncedDescriptionFilter,
                  })
                }
                className="h-10 w-10 p-0"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Atualizar</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="w-full border">
        <div className="w-full">
          <Table className="w-full [&_td]:px-3 [&_td]:py-2 [&_th]:px-3 [&_th]:py-2">
            <TableHeader>
              <TableRow>
                <TableHead
                  className="sticky top-0 z-10 w-[160px] cursor-pointer border-b font-bold select-none"
                  onClick={() => handleSort('holiday_date')}
                >
                  Data
                  {sortColumn === 'holiday_date' &&
                    (sortDirection === 'asc' ? (
                      <ArrowUp className="ml-1 inline h-3 w-3" />
                    ) : (
                      <ArrowDown className="ml-1 inline h-3 w-3" />
                    ))}
                </TableHead>
                <TableHead
                  className="sticky top-0 z-10 cursor-pointer border-b font-bold select-none"
                  onClick={() => handleSort('description')}
                >
                  Descrição
                  {sortColumn === 'description' &&
                    (sortDirection === 'asc' ? (
                      <ArrowUp className="ml-1 inline h-3 w-3" />
                    ) : (
                      <ArrowDown className="ml-1 inline h-3 w-3" />
                    ))}
                </TableHead>
                <TableHead className="sticky top-0 z-10 w-[90px] border-b text-center font-bold">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-40 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : sortedFeriados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    Nenhum feriado encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                sortedFeriados.map((feriado) => (
                  <TableRow key={feriado.id}>
                    <TableCell className="font-medium">
                      {editingId === feriado.id ? (
                        <Input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="h-10 border-0"
                        />
                      ) : (
                        formatDisplayDate(feriado.holiday_date)
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === feriado.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editDescription}
                            onChange={(e) =>
                              setEditDescription(e.target.value)
                            }
                            className="h-10 flex-1 border-0 text-sm"
                            placeholder="Descrição do feriado"
                          />
                          <div className="flex gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="default"
                                    size="icon"
                                    onClick={() => handleSave(feriado.id)}
                                    disabled={
                                      !editDescription.trim() || submitting
                                    }
                                    className="h-10 w-10 p-0"
                                  >
                                    <span className="text-xs">✓</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Guardar</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handleCancel}
                                    className="h-10 w-10 p-0"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Cancelar</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      ) : (
                        feriado.description
                      )}
                    </TableCell>
                    <TableCell className="flex justify-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="default"
                              size="icon"
                              onClick={() => {
                                setEditingId(feriado.id)
                                setEditDescription(feriado.description)
                                setEditDate(feriado.holiday_date)
                              }}
                              disabled={editingId !== null}
                              className="h-10 w-10 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => handleDelete(feriado.id)}
                              disabled={editingId !== null}
                              className="h-10 w-10 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Excluir</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
