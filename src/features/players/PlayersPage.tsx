import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { playersApi } from '../../shared/api/endpoints';
import type { Player, CreatePlayerDto } from '../../types/backend';

const CATEGORIES = ['Todos', 'ATP Pro', 'Amateur A', 'Amateur B', 'Sub-21', 'Inactivos'];
const SORT_OPTIONS = ['Ranking', 'Nombre', 'Puntos', 'Nacionalidad'];

const COLORS = {
  bg: '#0A0A0A',
  gold: '#C9A84C',
  goldLight: '#DDB85C',
  text: '#F0EAD6',
  textMuted: '#4A4A4A',
  border: '#1C1C1C',
};

export function PlayersPage() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos');
  const [sortBy, setSortBy] = useState('Ranking');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [deletingPlayer, setDeletingPlayer] = useState<Player | null>(null);
  const pageSize = 10;

  const { data: players = [], isLoading } = useQuery({
    queryKey: ['players'],
    queryFn: playersApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: playersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      setShowModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreatePlayerDto }) =>
      playersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      setShowModal(false);
      setEditingPlayer(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: playersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
    },
  });

  const handleDeleteClick = (player: Player, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingPlayer(player);
  };

  const handleConfirmDelete = () => {
    if (deletingPlayer) {
      deleteMutation.mutate(deletingPlayer.id);
      setDeletingPlayer(null);
    }
  };

  const handleEditClick = (player: Player) => {
    setEditingPlayer(player);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPlayer(null);
  };

  const handleSubmit = (data: CreatePlayerDto) => {
    if (editingPlayer) {
      updateMutation.mutate({ id: editingPlayer.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filtered = useMemo(() => {
    let list = [...players];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) => p.firstName.toLowerCase().includes(q) || 
               p.lastName.toLowerCase().includes(q) ||
               p.nationality.toLowerCase().includes(q)
      );
    }

    if (category === 'Inactivos') {
      list = list.filter((p) => p.status === 'INACTIVE');
    } else if (category === 'ATP Pro') {
      list = list.filter((p) => p.rankingPoints >= 5000);
    } else if (category === 'Amateur A') {
      list = list.filter((p) => p.rankingPoints >= 3000 && p.rankingPoints < 5000);
    } else if (category === 'Amateur B') {
      list = list.filter((p) => p.rankingPoints >= 1000 && p.rankingPoints < 3000);
    } else if (category === 'Sub-21') {
      list = list.filter((p) => p.rankingPoints < 1000);
    }

    if (sortBy === 'Nombre') list.sort((a, b) => (a.lastName + a.firstName).localeCompare(b.lastName + b.firstName));
    if (sortBy === 'Puntos') list.sort((a, b) => b.rankingPoints - a.rankingPoints);
    if (sortBy === 'Nacionalidad') list.sort((a, b) => a.nationality.localeCompare(b.nationality));
    if (sortBy === 'Ranking') list.sort((a, b) => b.rankingPoints - a.rankingPoints);

    return list;
  }, [players, search, category, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const stats = useMemo(() => ({
    total: players.length,
    activos: players.filter((p) => p.status === 'ACTIVE').length,
    suspendidos: players.filter((p) => p.status === 'SUSPENDED').length,
  }), [players]);

  const getInitials = (p: Player) => `${p.firstName[0]}${p.lastName[0]}`.toUpperCase();

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <div style={styles.logo}>
          <div style={styles.logoDiamond}><span style={styles.logoDiamondSpan}>A</span></div>
          <div style={styles.logoText}>Ace<em>Manager</em></div>
        </div>
        <div style={styles.navLinks}>
          {[
            { label: 'Jugadores', path: '/players' },
            { label: 'Torneos', path: '/tournaments' },
          ].map((link) => (
            <Link
              key={link.path}
              to={link.path}
              style={{
                ...styles.navLink,
                ...(location.pathname === link.path ? styles.navLinkActive : {}),
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>

      <header style={styles.pageHeader}>
        <div>
          <div style={styles.breadcrumb}>Inicio <span>/ Jugadores</span></div>
          <h1 style={styles.pageTitle}>Jugadores</h1>
          <div style={styles.pageCount}>
            <span>{players.length}</span> jugadores registrados
          </div>
        </div>
        <button style={styles.addBtn} onClick={() => setShowModal(true)}>+ Nuevo jugador</button>
      </header>

      <div style={styles.summary}>
        <div style={styles.summaryItem}>
          <div style={styles.summaryVal}>{stats.total}</div>
          <div style={styles.summaryLabel}>Total registrados</div>
        </div>
        <div style={styles.summaryItem}>
          <div style={styles.summaryVal}>{stats.activos}</div>
          <div style={styles.summaryLabel}>Activos</div>
        </div>
        <div style={styles.summaryItem}>
          <div style={styles.summaryVal}>{stats.suspendidos}</div>
          <div style={styles.summaryLabel}>Suspendidos</div>
        </div>
        <div style={styles.summaryItem}>
          <div style={styles.summaryVal}>
            {players.reduce((acc, p) => acc + p.rankingPoints, 0).toLocaleString()}
          </div>
          <div style={styles.summaryLabel}>Puntos totales</div>
        </div>
      </div>

      <div style={styles.toolbar}>
        <div style={styles.search}>
          <span style={styles.searchIcon}>⌕</span>
          <input
            type="text"
            placeholder="Buscar jugador, país..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={styles.searchInput}
          />
        </div>
        <div style={styles.filter}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => { setCategory(cat); setPage(1); }}
              style={{
                ...styles.filterBtn,
                ...(category === cat ? styles.filterBtnActive : {}),
              }}
            >
              {cat}
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
          <span>Jugador</span>
          <span>Género</span>
          <span>Email</span>
          <span>País</span>
          <span>Puntos</span>
          <span>Estado</span>
        </div>

        {isLoading ? (
          <div style={styles.empty}>
            <div style={styles.emptyTitle}>Cargando...</div>
          </div>
        ) : paginated.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyTitle}>Sin resultados</div>
            <div style={styles.emptySub}>Intentá con otro nombre o categoría</div>
          </div>
        ) : (
          paginated.map((player, idx) => (
            <div key={player.id} style={styles.row}>
              <div>
                <div style={styles.rankNum}>{idx + 1 + (currentPage - 1) * pageSize}</div>
              </div>
              <div style={styles.playerCell}>
                <div style={styles.avatar}>{getInitials(player)}</div>
                <div>
                  <div style={styles.playerName}>{player.firstName} {player.lastName}</div>
                  <div style={styles.playerNat}>{player.nationality}</div>
                </div>
              </div>
              <div>
                <span style={styles.genderBadge}>
                  {player.gender === 'MALE' ? '♂ Masculino' : '♀ Femenino'}
                </span>
              </div>
              <div style={styles.email}>{player.email}</div>
              <div style={styles.country}>{player.nationality}</div>
              <div>
                <div style={styles.ptsVal}>{player.rankingPoints.toLocaleString()}</div>
                <div style={styles.ptsSub}>pts</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    ...styles.statusDot,
                    background: player.status === 'ACTIVE' ? '#2A4A2A' : '#2A2A2A',
                    border: player.status === 'ACTIVE' ? '1px solid #3A6A3A' : '1px solid #3A3A3A',
                  }}
                />
                <button
                  style={styles.editBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditClick(player);
                  }}
                >
                  ✏️
                </button>
                <button
                  style={styles.deleteBtn}
                  onClick={(e) => handleDeleteClick(player, e)}
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
            {Math.min(currentPage * pageSize, filtered.length)} de {filtered.length} jugadores
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
        <PlayerModal
          player={editingPlayer}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {deletingPlayer && (
        <div style={styles.modalOverlay} onClick={() => setDeletingPlayer(null)}>
          <div style={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.confirmIcon}>⚠️</div>
            <h2 style={styles.confirmTitle}>Eliminar Jugador</h2>
            <p style={styles.confirmText}>
              ¿Estás seguro de eliminar a <strong>{deletingPlayer.firstName} {deletingPlayer.lastName}</strong>?
            </p>
            <p style={styles.confirmWarning}>Esta acción no se puede deshacer.</p>
            <div style={styles.confirmActions}>
              <button
                style={styles.btnCancel}
                onClick={() => setDeletingPlayer(null)}
              >
                Cancelar
              </button>
              <button
                style={styles.btnDanger}
                onClick={handleConfirmDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface PlayerModalProps {
  player: Player | null;
  onClose: () => void;
  onSubmit: (data: CreatePlayerDto) => void;
  isLoading?: boolean;
}

function PlayerModal({ player, onClose, onSubmit, isLoading }: PlayerModalProps) {
  const initialState: CreatePlayerDto = player
    ? {
        firstName: player.firstName,
        lastName: player.lastName,
        email: player.email,
        dateOfBirth: player.dateOfBirth,
        gender: player.gender,
        nationality: player.nationality,
      }
    : {
        firstName: '',
        lastName: '',
        email: '',
        dateOfBirth: '',
        gender: 'MALE',
        nationality: '',
      };

  const [formData, setFormData] = useState<CreatePlayerDto>(initialState);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: keyof CreatePlayerDto, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>{player ? 'Editar Jugador' : 'Nuevo Jugador'}</h2>
          <button style={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={styles.modalForm}>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Nombre</label>
              <input
                style={styles.formInput}
                type="text"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                required
                placeholder="Juan"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Apellido</label>
              <input
                style={styles.formInput}
                type="text"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                required
                placeholder="Martínez"
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Email</label>
            <input
              style={styles.formInput}
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              required
              placeholder="juan@email.com"
            />
          </div>

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Fecha de Nacimiento</label>
              <input
                style={styles.formInput}
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Género</label>
              <select
                style={styles.formSelect}
                value={formData.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
              >
                <option value="MALE">Masculino</option>
                <option value="FEMALE">Femenino</option>
              </select>
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Nacionalidad</label>
            <input
              style={styles.formInput}
              type="text"
              value={formData.nationality}
              onChange={(e) => handleChange('nationality', e.target.value)}
              required
              placeholder="ARG, ESP, USA..."
            />
          </div>

          <div style={styles.modalActions}>
            <button type="button" style={styles.btnCancel} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" style={styles.btnSubmit} disabled={isLoading}>
              {isLoading ? 'Guardando...' : player ? 'Actualizar' : 'Crear Jugador'}
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
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoDiamond: {
    width: '28px',
    height: '28px',
    background: COLORS.gold,
    transform: 'rotate(45deg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoDiamondSpan: {
    transform: 'rotate(-45deg)',
    fontSize: '14px',
    fontWeight: 700,
    color: COLORS.bg,
    display: 'block',
  },
  logoText: {
    fontSize: '16px',
    fontWeight: 700,
    color: COLORS.text,
    letterSpacing: '1px',
  },
  navLinks: {
    display: 'flex',
    gap: '32px',
  },
  navLink: {
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '2px',
    textTransform: 'uppercase',
    color: COLORS.textMuted,
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    transition: 'color 0.2s',
    padding: 0,
  },
  navLinkActive: {
    color: COLORS.gold,
  },
  pageHeader: {
    padding: '40px 40px 32px',
    borderBottom: `1px solid ${COLORS.border}`,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  breadcrumb: {
    fontSize: '11px',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    color: '#3A3A3A',
    marginBottom: '12px',
  },
  pageTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '40px',
    fontWeight: 900,
    color: COLORS.text,
    margin: 0,
  },
  pageCount: {
    fontSize: '12px',
    color: '#3A3A3A',
    letterSpacing: '1px',
    marginTop: '6px',
  },
  addBtn: {
    background: COLORS.gold,
    color: COLORS.bg,
    padding: '12px 24px',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    cursor: 'pointer',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'background 0.2s',
  },
  summary: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1px',
    background: COLORS.border,
  },
  summaryItem: {
    background: '#080808',
    padding: '20px 28px',
  },
  summaryVal: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '28px',
    fontWeight: 700,
    color: COLORS.gold,
  },
  summaryLabel: {
    fontSize: '10px',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    color: '#3A3A3A',
    marginTop: '4px',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px 40px',
    borderBottom: '1px solid #111',
    background: '#050505',
    flexWrap: 'wrap',
  },
  search: {
    position: 'relative',
    flex: '1',
    maxWidth: '320px',
    minWidth: '200px',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#3A3A3A',
    fontSize: '16px',
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    background: '#0F0F0F',
    border: `1px solid ${COLORS.border}`,
    color: '#D0C8B8',
    padding: '10px 16px 10px 38px',
    fontFamily: "'Barlow', sans-serif",
    fontSize: '13px',
    outline: 'none',
  },
  filter: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  filterBtn: {
    padding: '9px 14px',
    fontSize: '11px',
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    fontFamily: "'Barlow', sans-serif",
    background: 'transparent',
    border: `1px solid ${COLORS.border}`,
    color: COLORS.textMuted,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  filterBtnActive: {
    borderColor: `${COLORS.gold}44`,
    color: COLORS.gold,
    background: `${COLORS.gold}08`,
  },
  sort: {
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  sortLabel: {
    fontSize: '11px',
    letterSpacing: '1px',
    color: '#3A3A3A',
    textTransform: 'uppercase',
  },
  sortSelect: {
    background: '#0F0F0F',
    border: `1px solid ${COLORS.border}`,
    color: COLORS.textMuted,
    padding: '9px 14px',
    fontFamily: "'Barlow', sans-serif",
    fontSize: '11px',
    letterSpacing: '1px',
    outline: 'none',
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
  tableWrap: {
    padding: '0 40px 40px',
  },
  tableHead: {
    display: 'grid',
    gridTemplateColumns: '60px 1fr 120px 180px 80px 80px 80px',
    padding: '14px 0',
    borderBottom: `1px solid ${COLORS.border}`,
    marginTop: '20px',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '60px 1fr 120px 180px 80px 80px 80px',
    padding: '18px 0',
    borderBottom: '1px solid #0F0F0F',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  rankNum: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '22px',
    fontWeight: 700,
    color: '#1E1E1E',
    lineHeight: 1,
  },
  playerCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  avatar: {
    width: '42px',
    height: '42px',
    background: '#111',
    border: `1px solid ${COLORS.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Playfair Display', serif",
    fontSize: '14px',
    fontWeight: 700,
    color: COLORS.gold,
  },
  playerName: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#D0C8B8',
  },
  playerNat: {
    fontSize: '11px',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    color: '#3A3A3A',
    marginTop: '3px',
  },
  genderBadge: {
    display: 'inline-block',
    fontSize: '10px',
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    padding: '4px 10px',
    border: '1px solid #2A2A2A',
    color: '#4A4A4A',
  },
  email: {
    fontSize: '12px',
    color: '#5A5A5A',
  },
  country: {
    fontSize: '13px',
    color: '#5A5A5A',
  },
  ptsVal: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '16px',
    fontWeight: 700,
    color: COLORS.gold,
  },
  ptsSub: {
    fontSize: '11px',
    color: '#3A3A3A',
    marginTop: '2px',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  editBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    opacity: 0.6,
    transition: 'opacity 0.2s',
    padding: '4px',
  },
  deleteBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    opacity: 0.6,
    transition: 'opacity 0.2s',
    padding: '4px',
  },
  empty: {
    padding: '64px 0',
    textAlign: 'center',
  },
  emptyTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '24px',
    color: '#2A2A2A',
    marginBottom: '8px',
  },
  emptySub: {
    fontSize: '13px',
    color: '#3A3A3A',
    letterSpacing: '1px',
  },
  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '24px 0',
    borderTop: `1px solid ${COLORS.border}`,
    marginTop: '8px',
  },
  pagInfo: {
    fontSize: '12px',
    color: '#3A3A3A',
    letterSpacing: '1px',
  },
  pagBtns: {
    display: 'flex',
    gap: '4px',
  },
  pagBtn: {
    width: '34px',
    height: '34px',
    border: `1px solid ${COLORS.border}`,
    background: 'transparent',
    fontFamily: "'Barlow', sans-serif",
    fontSize: '12px',
    color: COLORS.textMuted,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  pagBtnActive: {
    borderColor: `${COLORS.gold}44`,
    color: COLORS.gold,
    background: `${COLORS.gold}0A`,
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  modalContent: {
    background: '#0F0F0F',
    border: `1px solid ${COLORS.border}`,
    width: '100%',
    maxWidth: '520px',
    padding: '32px',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  modalTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '24px',
    fontWeight: 700,
    color: COLORS.text,
    margin: 0,
  },
  modalClose: {
    background: 'transparent',
    border: 'none',
    color: COLORS.textMuted,
    fontSize: '20px',
    cursor: 'pointer',
    padding: '4px',
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  formLabel: {
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    color: COLORS.textMuted,
  },
  formInput: {
    background: '#080808',
    border: `1px solid ${COLORS.border}`,
    color: COLORS.text,
    padding: '12px 16px',
    fontSize: '14px',
    fontFamily: "'Barlow', sans-serif",
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  formSelect: {
    background: '#080808',
    border: `1px solid ${COLORS.border}`,
    color: COLORS.text,
    padding: '12px 16px',
    fontSize: '14px',
    fontFamily: "'Barlow', sans-serif",
    outline: 'none',
    cursor: 'pointer',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '8px',
  },
  btnCancel: {
    background: 'transparent',
    border: `1px solid ${COLORS.border}`,
    color: COLORS.textMuted,
    padding: '12px 24px',
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
  btnSubmit: {
    background: COLORS.gold,
    color: COLORS.bg,
    border: 'none',
    padding: '12px 32px',
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  confirmModal: {
    background: '#0F0F0F',
    border: `1px solid ${COLORS.border}`,
    width: '100%',
    maxWidth: '420px',
    padding: '32px',
    textAlign: 'center',
  },
  confirmIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  confirmTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '24px',
    fontWeight: 700,
    color: COLORS.text,
    margin: '0 0 16px',
  },
  confirmText: {
    fontSize: '14px',
    color: COLORS.text,
    marginBottom: '8px',
  },
  confirmWarning: {
    fontSize: '12px',
    color: COLORS.textMuted,
    marginBottom: '24px',
  },
  confirmActions: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
  },
  btnDanger: {
    background: '#dc2626',
    color: '#fff',
    border: 'none',
    padding: '12px 32px',
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
};