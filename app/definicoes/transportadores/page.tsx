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
import { Plus, Trash2, X, Loader2, Pencil, RotateCw } from 'lucide-react'

interface Transportadora {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export default function TransportadoresPage() {
  const [transportadoras, setTransportadoras] = useState<Transportadora[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({ name: '' })
  const [nameFilter, setNameFilter] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [debouncedNameFilter, setDebouncedNameFilter] = useState(nameFilter)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedNameFilter(nameFilter)
    }, 300)
    return () => clearTimeout(timer)
  }, [nameFilter])

  const supabase = createClient()

  const fetchTransportadoras = useCallback(
    async (filters: { nameFilter?: string } = {}) => {
      setLoading(true)
      try {
        let query = supabase.from('transportadora').select('*')

        if (filters.nameFilter?.trim?.()) {
          query = query.ilike('name', `%${filters.nameFilter.trim()}%`)
        }

        const { data, error } = await query.order('name', { ascending: true })

        if (!error && data) {
          setTransportadoras(data)
        }
      } catch (error) {
        console.error('Error fetching transportadoras:', error)
      } finally {
        setLoading(false)
      }
    },
    [supabase],
  )

  useEffect(() => {
    fetchTransportadoras()
  }, [fetchTransportadoras])

  useEffect(() => {
    fetchTransportadoras({ nameFilter: debouncedNameFilter })
  }, [debouncedNameFilter, fetchTransportadoras])

  const filteredTransportadoras = transportadoras

  const handleAddNew = () => {
    if (editingId !== null) return
    setEditingId('new')
    setEditName('')
  }

  const handleAddSave = async () => {
    if (!editName.trim()) return
    setSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('transportadora')
        .insert({ name: editName.trim() })
        .select('*')
      if (!error && data && data[0]) {
        setTransportadoras((prev) => [data[0], ...prev])
      }
      setEditingId(null)
      setEditName('')
    } catch (error) {
      console.error('Error creating transportadora:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (transportadora: Transportadora) => {
    setEditingId(transportadora.id)
    setEditName(transportadora.name)
  }

  const handleEditSave = async (id: string) => {
    if (id === 'new') {
      await handleAddSave()
      return
    }
    if (!editName.trim()) return
    setSubmitting(true)
    try {
      const updates = {
        name: editName.trim(),
        updated_at: new Date().toISOString().split('T')[0],
      }
      const { error } = await supabase
        .from('transportadora')
        .update(updates)
        .eq('id', id)
      if (!error) {
        setTransportadoras((prev) =>
          prev.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        )
      }
      setEditingId(null)
      setEditName('')
    } catch (error) {
      console.error('Error updating transportadora:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditCancel = () => {
    if (editingId === 'new') {
      setEditingId(null)
      setEditName('')
      return
    }
    setEditingId(null)
    setEditName('')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta transportadora?')) return

    try {
      const { error } = await supabase
        .from('transportadora')
        .delete()
        .eq('id', id)

      if (!error) {
        setTransportadoras((prev) => prev.filter((t) => t.id !== id))
      }
    } catch (error) {
      console.error('Error deleting transportadora:', error)
    }
  }

  const resetForm = () => {
    setFormData({ name: '' })
    setEditingId(null)
    setEditName('')
  }

  return (
    <div className="w-full space-y-6 p-4 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestão de Transportadoras</h1>
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => fetchTransportadoras()}
                  variant="outline"
                  size="icon"
                  aria-label="Atualizar"
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
                  variant="default"
                  size="icon"
                  aria-label="Adicionar"
                  disabled={editingId !== null}
                  className="h-10 w-10 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Adicionar</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="mb-6 flex items-center gap-2">
        <Input
          placeholder="Filtrar por nome..."
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          className="w-[300px]"
        />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setNameFilter('')}
                aria-label="Limpar filtro"
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
                  fetchTransportadoras({ nameFilter: debouncedNameFilter })
                }
                aria-label="Atualizar"
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
                <TableHead className="sticky top-0 z-10 border-b font-bold">
                  Nome da Transportadora
                </TableHead>
                <TableHead className="sticky top-0 z-10 w-[90px] border-b text-center font-bold">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={2} className="h-40 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : filteredTransportadoras.length === 0 &&
                editingId !== 'new' ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center">
                    Nenhuma transportadora encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {editingId === 'new' && (
                    <TableRow>
                      <TableCell className="font-medium">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          autoFocus
                          disabled={submitting}
                        />
                      </TableCell>
                      <TableCell className="flex justify-center gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="default"
                                size="icon"
                                onClick={handleAddSave}
                                disabled={submitting || !editName.trim()}
                                aria-label="Guardar"
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
                                onClick={handleEditCancel}
                                disabled={submitting}
                                aria-label="Cancelar"
                                className="h-10 w-10 p-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Cancelar</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  )}
                  {filteredTransportadoras.map((transportadora) => (
                    <TableRow key={transportadora.id}>
                      <TableCell className="font-medium">
                        {editingId === transportadora.id ? (
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            autoFocus
                            disabled={submitting}
                          />
                        ) : (
                          transportadora.name
                        )}
                      </TableCell>
                      <TableCell className="flex justify-center gap-2">
                        {editingId === transportadora.id ? (
                          <>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="default"
                                    size="icon"
                                    onClick={() =>
                                      handleEditSave(transportadora.id)
                                    }
                                    disabled={submitting || !editName.trim()}
                                    aria-label="Guardar"
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
                                    onClick={handleEditCancel}
                                    disabled={submitting}
                                    aria-label="Cancelar"
                                    className="h-10 w-10 p-0"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Cancelar</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </>
                        ) : (
                          <>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="default"
                                    size="icon"
                                    onClick={() => handleEdit(transportadora)}
                                    aria-label="Editar"
                                    disabled={editingId !== null}
                                    className="h-10 w-10 p-0"
                                  >
                                    <Pencil className="h-4 w-4" />
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
                                    onClick={() =>
                                      handleDelete(transportadora.id)
                                    }
                                    aria-label="Eliminar transportadora"
                                    disabled={editingId !== null}
                                    className="h-10 w-10 p-0"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Eliminar</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
