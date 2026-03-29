import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tournamentsApi } from '../../shared/api/endpoints';
import type { Tournament, CreateTournamentDto, TournamentStatus } from '../../types/backend';

const STATUS_OPTIONS = ['Todos', 'DRAFT', 'REGISTRATION_OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const SORT_OPTIONS = ['Fecha', 'Nombre', 'Categoría'];

const STATUS_LABELS: Record<TournamentStatus, string> = {
  DRAFT: 'Borrador',
  REGISTRATION_OPEN: 'Inscripción Abierta',
  IN_PROGRESS: 'En Progreso',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
};

const STATUS_COLORS: Record<TournamentStatus, string> = {
  DRAFT: '#6b7280',
  REGISTRATION_OPEN: '#2563eb',
  IN_PROGRESS: '#d97706',
  COMPLETED: '#16a34a',
  CANCELLED: '#dc2626',
};

const COLORS = {
  bg: '#0A0A0A',
  gold: '#C9A84C',
  goldLight: '#DDB85C',
  text: '#F0EAD6',
  textMuted: '#4A4A4A',
  border: '#1C1C1C',
};

export function TournamentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [sortBy, setSortBy] = useState('Fecha');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [deletingTournament, setDeletingTournament] = useState<Tournament | null>(null);
  const pageSize = 10;

  const { data: tournaments = [], isLoading } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => tournamentsApi.getAll(statusFilter === 'Todos' ? undefined : statusFilter),
  });

  const createMutation = useMutation({
    mutationFn: tournamentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      setShowModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateTournamentDto }) =>
      tournamentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      setShowModal(false);
      setEditingTournament(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: tournamentsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      setDeletingTournament(null);
    },
  });

  const handleEditClick = (tournament: Tournament) => {
    setEditingTournament(tournament);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTournament(null);
  };

  const handleSubmit = (data: CreateTournamentDto) => {
    if (editingTournament) {
      updateMutation.mutate({ id: editingTournament.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filtered = useMemo(() => {
    let list = [...tournaments];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.name.toLowerCase().includes(q));
    }

    if (sortBy === 'Nombre') list.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === 'Categoría') list.sort((a, b) => a.category.localeCompare(b.category));
    if (sortBy === 'Fecha') list.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

    return list;
  }, [tournaments, search, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const stats = useMemo(() => ({
    total: tournaments.length,
    activos: tournaments.filter((t) => t.status === 'REGISTRATION_OPEN' || t.status === 'IN_PROGRESS').length,
    próximos: tournaments.filter((t) => t.status === 'DRAFT').length,
  }), [tournaments]);

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <div style={styles.logo}>
          <div style={styles.logoDiamond}><span style={styles.logoDiamondSpan}>A</span></div>
          <div style={styles.logoText}>Ace<em>Manager</em></div>
        </div>
        <div style={styles.navLinks}>
          {['Inicio', 'Torneos', 'Jugadores', 'Rankings'].map((link) => (
            <button
              key={link}
              style={{
                ...styles.navLink,
                ...(link === 'Torneos' ? styles.navLinkActive : {}),
              }}
            >
              {link}
            </button>
          ))}
        </div>
      </nav>

      <header style={styles.pageHeader}>
        <div>
          <div style={styles.breadcrumb}>Inicio <span>/ Torneos</span></div>
          <h1 style={styles.pageTitle}>Torneos</h1>
          <div style={styles.pageCount}>
            <span>{tournaments.length}</span> torneos registrados
          </div>
        </div>
        <button style={styles.addBtn} onClick={() => setShowModal(true)}>+ Nuevo Torneo</button>
      </header>

      <div style={styles.summary}>
        <div style={styles.summaryItem}>
          <div style={styles.summaryVal}>{stats.total}</div>
          <div style={styles.summaryLabel}>Total torneos</div>
        </div>
        <div style={styles.summaryItem}>
          <div style={styles.summaryVal}>{stats.activos}</div>
          <div style={styles.summaryLabel}>Activos</div>
        </div>
        <div style={styles.summaryItem}>
          <div style={styles.summaryVal}>{stats.próximos}</div>
          <div style={styles.summaryLabel}>Próximos</div>
        </div>
        <div style={styles.summaryItem}>
          <div style={styles.summaryVal}>
            {tournaments.filter((t) => t.status === 'COMPLETED').length}
          </div>
          <div style={styles.summaryLabel}>Completados</div>
        </div>
      </div>

      <div style={styles.toolbar}>
        <div style={styles.search}>
          <span style={styles.searchIcon}>⌕</span>
          <input
            type="text"
            placeholder="Buscar torneo..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={styles.searchInput}
          />
        </div>
        <div style={styles.filter}>
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setPage(1); }}
              style={{
                ...styles.filterBtn,
                ...(statusFilter === status ? styles.filterBtnActive : {}),
              }}
            >
              {status === 'Todos' ? 'Todos' : STATUS_LABELS[status as TournamentStatus] || status}
            </button>
          ))}
        </div>
        <div style={styles.sort}>
          <span style={styles.sortLabel}>Ordenar por</span>
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
            style={styles.sortSelect}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={styles.tableWrap}>
        <div style={styles.tableHead}>
          <span>#</span>
          <span>Torneo</span>
          <span>Tipo</span>
          <span>Categoría</span>
          <span>Fechas</span>
          <span>Estado</span>
          <span>Acciones</span>
        </div>

        {isLoading ? (
          <div style={styles.empty}>
            <div style={styles.emptyTitle}>Cargando...</div>
          </div>
        ) : paginated.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyTitle}>Sin resultados</div>
            <div style={styles.emptySub}>Intentá con otro nombre o estado</div>
          </div>
        ) : (
          paginated.map((tournament, idx) => (
            <div key={tournament.id} style={styles.row}>
              <div>
                <div style={styles.rankNum}>{idx + 1 + (currentPage - 1) * pageSize}</div>
              </div>
              <div style={styles.playerCell}>
                <div style={styles.avatar}>🎾</div>
                <div>
                  <div style={styles.playerName}>{tournament.name}</div>
                  <div style={styles.playerNat}>{tournament.maxParticipants} cupos</div>
                </div>
              </div>
              <div>
                <span style={styles.genderBadge}>
                  {tournament.type === 'SINGLES' ? '♂ Singles' : tournament.type === 'DOUBLES' ? '♂♀ Dobles' : '♂♀ Mixtos'}
                </span>
              </div>
              <div style={styles.category}>{tournament.category.replace(/_/g, ' ')}</div>
              <div style={styles.dates}>
                <div style={styles.dateRange}>
                  {new Date(tournament.startDate).toLocaleDateString('es-AR')} - {new Date(tournament.endDate).toLocaleDateString('es-AR')}
                </div>
              </div>
              <div>
                <span
                  style={{
                    ...styles.statusBadge,
                    backgroundColor: STATUS_COLORS[tournament.status],
                  }}
                >
                  {STATUS_LABELS[tournament.status]}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  style={styles.editBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditClick(tournament);
                  }}
                >
                  ✏️
                </button>
                <button
                  style={styles.deleteBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingTournament(tournament);
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}

        <div style={styles.pagination}>
          <div style={styles.pagInfo}>
            Mostrando {Math.min((currentPage - 1) * pageSize + 1, filtered.length)}-
            {Math.min(currentPage * pageSize, filtered.length)} de {filtered.length} torneos
          </div>
          <div style={styles.pagBtns}>
            <button
              style={styles.pagBtn}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                style={{
                  ...styles.pagBtn,
                  ...(n === currentPage ? styles.pagBtnActive : {}),
                }}
                onClick={() => setPage(n)}
              >
                {n}
              </button>
            ))}
            <button
              style={styles.pagBtn}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <TournamentModal
          tournament={editingTournament}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {deletingTournament && (
        <div style={styles.modalOverlay} onClick={() => setDeletingTournament(null)}>
          <div style={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.confirmIcon}>⚠️</div>
            <h2 style={styles.confirmTitle}>Cancelar Torneo</h2>
            <p style={styles.confirmText}>
              ¿Estás seguro de cancelar el torneo <strong>{deletingTournament.name}</strong>?
            </p>
            <p style={styles.confirmWarning}>Esta acción no se puede deshacer.</p>
            <div style={styles.confirmActions}>
              <button
                style={styles.btnCancel}
                onClick={() => setDeletingTournament(null)}
              >
                Cancelar
              </button>
              <button
                style={styles.btnDanger}
                onClick={() => {
                  deleteMutation.mutate(deletingTournament.id);
                  setDeletingTournament(null);
                }}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Cancelando...' : 'Cancelar Torneo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface TournamentModalProps {
  tournament: Tournament | null;
  onClose: () => void;
  onSubmit: (data: CreateTournamentDto) => void;
  isLoading?: boolean;
}

const TYPES = ['SINGLES', 'DOUBLES', 'MIXED_DOUBLES'] as const;
const CATEGORIES = ['FUTURES', 'CHALLENGER', 'ATP_250', 'ATP_500', 'GRAND_SLAM'] as const;

function TournamentModal({ tournament, onClose, onSubmit, isLoading }: TournamentModalProps) {
  const initialState: CreateTournamentDto = tournament
    ? {
        name: tournament.name,
        type: tournament.type,
        category: tournament.category,
        startDate: tournament.startDate,
        endDate: tournament.endDate,
        maxParticipants: tournament.maxParticipants,
        genderRestriction: tournament.genderRestriction || undefined,
      }
    : {
        name: '',
        type: 'SINGLES',
        category: 'ATP_250',
        startDate: '',
        endDate: '',
        maxParticipants: 32,
        genderRestriction: undefined,
      };

  const [formData, setFormData] = useState<CreateTournamentDto>(initialState);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: keyof CreateTournamentDto, value: string | number | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>{tournament ? 'Editar Torneo' : 'Nuevo Torneo'}</h2>
          <button style={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={styles.modalForm}>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Nombre del Torneo</label>
            <input
              style={styles.formInput}
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
              placeholder="ATP Buenos Aires 2026"
            />
          </div>

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Tipo</label>
              <select
                style={styles.formSelect}
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>{t === 'SINGLES' ? 'Singles' : t === 'DOUBLES' ? 'Dobles' : 'Dobles Mixtos'}</option>
                ))}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Categoría</label>
              <select
                style={styles.formSelect}
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Fecha Inicio</label>
              <input
                style={styles.formInput}
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Fecha Fin</label>
              <input
                style={styles.formInput}
                type="date"
                value={formData.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                required
              />
            </div>
          </div>

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Cupos Máximos</label>
              <input
                style={styles.formInput}
                type="number"
                min="2"
                max="128"
                value={formData.maxParticipants}
                onChange={(e) => handleChange('maxParticipants', parseInt(e.target.value))}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Restricción Género</label>
              <select
                style={styles.formSelect}
                value={formData.genderRestriction || ''}
                onChange={(e) => handleChange('genderRestriction', e.target.value || undefined)}
              >
                <option value="">Abierto a todos</option>
                <option value="MALE">Solo Masculino</option>
                <option value="FEMALE">Solo Femenino</option>
              </select>
            </div>
          </div>

          <div style={styles.modalActions}>
            <button type="button" style={styles.btnCancel} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" style={styles.btnSubmit} disabled={isLoading}>
              {isLoading ? 'Guardando...' : tournament ? 'Actualizar' : 'Crear Torneo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    fontFamily: "'Barlow', system-ui, sans-serif",
    background: COLORS.bg,
    color: COLORS.text,
    minHeight: '100vh',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 40px',
    height: '60px',
    borderBottom: `1px solid ${COLORS.border}`,
    background: COLORS.bg,
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  logo: { display: 'flex', alignItems: 'center', gap: '10px' },
  logoDiamond: {
    width: '28px', height: '28px', background: COLORS.gold, transform: 'rotate(45deg)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoDiamondSpan: {
    transform: 'rotate(-45deg)', fontSize: '14px', fontWeight: 700, color: COLORS.bg, display: 'block',
  },
  logoText: { fontSize: '16px', fontWeight: 700, color: COLORS.text, letterSpacing: '1px' },
  navLinks: { display: 'flex', gap: '32px' },
  navLink: {
    fontSize: '11px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase',
    color: COLORS.textMuted, cursor: 'pointer', border: 'none', background: 'none',
    transition: 'color 0.2s', padding: 0,
  },
  navLinkActive: { color: COLORS.gold },
  pageHeader: {
    padding: '40px 40px 32px', borderBottom: `1px solid ${COLORS.border}`,
    display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
  },
  breadcrumb: {
    fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase',
    color: '#3A3A3A', marginBottom: '12px',
  },
  pageTitle: {
    fontFamily: "'Playfair Display', serif", fontSize: '40px', fontWeight: 900,
    color: COLORS.text, margin: 0,
  },
  pageCount: { fontSize: '12px', color: '#3A3A3A', letterSpacing: '1px', marginTop: '6px' },
  addBtn: {
    background: COLORS.gold, color: COLORS.bg, padding: '12px 24px', fontSize: '11px',
    fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', cursor: 'pointer',
    border: 'none', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background 0.2s',
  },
  summary: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: COLORS.border },
  summaryItem: { background: '#080808', padding: '20px 28px' },
  summaryVal: { fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: 700, color: COLORS.gold },
  summaryLabel: { fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: '#3A3A3A', marginTop: '4px' },
  toolbar: {
    display: 'flex', alignItems: 'center', gap: '16px', padding: '20px 40px',
    borderBottom: '1px solid #111', background: '#050505', flexWrap: 'wrap',
  },
  search: { position: 'relative', flex: '1', maxWidth: '320px', minWidth: '200px' },
  searchIcon: {
    position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
    color: '#3A3A3A', fontSize: '16px', pointerEvents: 'none',
  },
  searchInput: {
    width: '100%', background: '#0F0F0F', border: `1px solid ${COLORS.border}`, color: '#D0C8B8',
    padding: '10px 16px 10px 38px', fontFamily: "'Barlow', sans-serif", fontSize: '13px', outline: 'none',
  },
  filter: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  filterBtn: {
    padding: '9px 14px', fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase',
    fontFamily: "'Barlow', sans-serif", background: 'transparent', border: `1px solid ${COLORS.border}`,
    color: COLORS.textMuted, cursor: 'pointer', transition: 'all 0.2s',
  },
  filterBtnActive: {
    borderColor: `${COLORS.gold}44`, color: COLORS.gold, background: `${COLORS.gold}08`,
  },
  sort: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' },
  sortLabel: { fontSize: '11px', letterSpacing: '1px', color: '#3A3A3A', textTransform: 'uppercase' },
  sortSelect: {
    background: '#0F0F0F', border: `1px solid ${COLORS.border}`, color: COLORS.textMuted,
    padding: '9px 14px', fontFamily: "'Barlow', sans-serif", fontSize: '11px', letterSpacing: '1px',
    outline: 'none', textTransform: 'uppercase', cursor: 'pointer',
  },
  tableWrap: { padding: '0 40px 40px' },
  tableHead: {
    display: 'grid', gridTemplateColumns: '60px 1.5fr 100px 100px 140px 130px 80px',
    padding: '14px 0', borderBottom: `1px solid ${COLORS.border}`, marginTop: '20px',
  },
  row: {
    display: 'grid', gridTemplateColumns: '60px 1.5fr 100px 100px 140px 130px 80px',
    padding: '18px 0', borderBottom: '1px solid #0F0F0F', alignItems: 'center', cursor: 'pointer', transition: 'background 0.15s',
  },
  rankNum: { fontFamily: "'Playfair Display', serif", fontSize: '22px', fontWeight: 700, color: '#1E1E1E', lineHeight: 1 },
  playerCell: { display: 'flex', alignItems: 'center', gap: '14px' },
  avatar: {
    width: '42px', height: '42px', background: '#111', border: `1px solid ${COLORS.border}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
  },
  playerName: { fontSize: '14px', fontWeight: 600, color: '#D0C8B8' },
  playerNat: { fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', color: '#3A3A3A', marginTop: '3px' },
  genderBadge: {
    display: 'inline-block', fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase',
    padding: '4px 10px', border: '1px solid #2A2A2A', color: '#4A4A4A',
  },
  category: { fontSize: '12px', color: '#5A5A5A', textTransform: 'uppercase', letterSpacing: '1px' },
  dates: { fontSize: '12px', color: '#5A5A5A' },
  dateRange: { fontSize: '12px', color: '#5A5A5A' },
  statusBadge: {
    padding: '4px 10px', borderRadius: '4px', fontSize: '10px', fontWeight: 600,
    letterSpacing: '1px', textTransform: 'uppercase', color: '#fff',
  },
  editBtn: { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px', opacity: 0.6, transition: 'opacity 0.2s', padding: '4px' },
  deleteBtn: { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px', opacity: 0.6, transition: 'opacity 0.2s', padding: '4px' },
  empty: { padding: '64px 0', textAlign: 'center' },
  emptyTitle: { fontFamily: "'Playfair Display', serif", fontSize: '24px', color: '#2A2A2A', marginBottom: '8px' },
  emptySub: { fontSize: '13px', color: '#3A3A3A', letterSpacing: '1px' },
  pagination: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 0',
    borderTop: `1px solid ${COLORS.border}`, marginTop: '8px',
  },
  pagInfo: { fontSize: '12px', color: '#3A3A3A', letterSpacing: '1px' },
  pagBtns: { display: 'flex', gap: '4px' },
  pagBtn: {
    width: '34px', height: '34px', border: `1px solid ${COLORS.border}`, background: 'transparent',
    fontFamily: "'Barlow', sans-serif", fontSize: '12px', color: COLORS.textMuted, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
  },
  pagBtnActive: { borderColor: `${COLORS.gold}44`, color: COLORS.gold, background: `${COLORS.gold}0A` },
  modalOverlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.85)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
  },
  modalContent: {
    background: '#0F0F0F', border: `1px solid ${COLORS.border}`, width: '100%', maxWidth: '560px', padding: '32px',
  },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  modalTitle: { fontFamily: "'Playfair Display', serif", fontSize: '24px', fontWeight: 700, color: COLORS.text, margin: 0 },
  modalClose: { background: 'transparent', border: 'none', color: COLORS.textMuted, fontSize: '20px', cursor: 'pointer', padding: '4px' },
  modalForm: { display: 'flex', flexDirection: 'column', gap: '16px' },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  formLabel: { fontSize: '11px', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: COLORS.textMuted },
  formInput: {
    background: '#080808', border: `1px solid ${COLORS.border}`, color: COLORS.text, padding: '12px 16px',
    fontSize: '14px', fontFamily: "'Barlow', sans-serif", outline: 'none', transition: 'border-color 0.2s',
  },
  formSelect: {
    background: '#080808', border: `1px solid ${COLORS.border}`, color: COLORS.text, padding: '12px 16px',
    fontSize: '14px', fontFamily: "'Barlow', sans-serif", outline: 'none', cursor: 'pointer',
  },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' },
  btnCancel: {
    background: 'transparent', border: `1px solid ${COLORS.border}`, color: COLORS.textMuted,
    padding: '12px 24px', fontSize: '12px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer',
  },
  btnSubmit: {
    background: COLORS.gold, color: COLORS.bg, border: 'none', padding: '12px 32px', fontSize: '12px',
    fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer', transition: 'background 0.2s',
  },
  confirmModal: {
    background: '#0F0F0F', border: `1px solid ${COLORS.border}`, width: '100%', maxWidth: '420px', padding: '32px', textAlign: 'center',
  },
  confirmIcon: { fontSize: '48px', marginBottom: '16px' },
  confirmTitle: { fontFamily: "'Playfair Display', serif", fontSize: '24px', fontWeight: 700, color: COLORS.text, margin: '0 0 16px' },
  confirmText: { fontSize: '14px', color: COLORS.text, marginBottom: '8px' },
  confirmWarning: { fontSize: '12px', color: COLORS.textMuted, marginBottom: '24px' },
  confirmActions: { display: 'flex', justifyContent: 'center', gap: '12px' },
  btnDanger: {
    background: '#dc2626', color: '#fff', border: 'none', padding: '12px 32px', fontSize: '12px',
    fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer', transition: 'background 0.2s',
  },
};