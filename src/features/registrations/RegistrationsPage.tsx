import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { tournamentsApi, registrationsApi, playersApi } from '../../shared/api/endpoints';
import type { CreateRegistrationDto, TournamentStatus } from '../../types/backend';

const STATUS_LABELS: Record<TournamentStatus, string> = {
  DRAFT: 'Borrador',
  REGISTRATION_OPEN: 'Inscripción Abierta',
  IN_PROGRESS: 'En Progreso',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
};

const COLORS = {
  bg: '#0A0A0A',
  gold: '#C9A84C',
  goldLight: '#DDB85C',
  text: '#F0EAD6',
  textMuted: '#4A4A4A',
  border: '#1C1C1C',
};

export function RegistrationsPage() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const [selectedTournament, setSelectedTournament] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);

  const { data: tournaments = [] } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => tournamentsApi.getAll(),
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: playersApi.getAll,
  });

  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ['registrations', selectedTournament],
    queryFn: () => selectedTournament ? registrationsApi.getByTournament(selectedTournament) : Promise.resolve([]),
    enabled: !!selectedTournament,
  });

  const createMutation = useMutation({
    mutationFn: ({ tournamentId, data }: { tournamentId: number; data: CreateRegistrationDto }) =>
      registrationsApi.create(tournamentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      setShowModal(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ tournamentId, playerId }: { tournamentId: number; playerId: number }) =>
      registrationsApi.delete(tournamentId, playerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
    },
  });

  const availablePlayers = useMemo(() => {
    if (!selectedTournament) return [];
    const registeredIds = registrations.map(r => r.playerId);
    return players.filter(p => p.status === 'ACTIVE' && !registeredIds.includes(p.id));
  }, [players, registrations, selectedTournament]);

  const selectedTournamentData = tournaments.find(t => t.id === selectedTournament);

  const handleSubmit = (playerId: number) => {
    if (selectedTournament) {
      createMutation.mutate({ tournamentId: selectedTournament, data: { playerId } });
    }
  };

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
          <div style={styles.breadcrumb}>Inicio <span>/ Inscripciones</span></div>
          <h1 style={styles.pageTitle}>Inscripciones</h1>
          <div style={styles.pageCount}>
            Gestiona las inscripciones de tus torneos
          </div>
        </div>
      </header>

      <div style={styles.content}>
        <div style={styles.sidebar}>
          <h3 style={styles.sidebarTitle}>Torneos</h3>
          <div style={styles.tournamentList}>
            {tournaments.map((tournament) => (
              <button
                key={tournament.id}
                style={{
                  ...styles.tournamentItem,
                  ...(selectedTournament === tournament.id ? styles.tournamentItemActive : {}),
                }}
                onClick={() => setSelectedTournament(tournament.id)}
              >
                <div style={styles.tournamentName}>{tournament.name}</div>
                <div style={styles.tournamentMeta}>
                  <span style={styles.statusBadge}>
                    {STATUS_LABELS[tournament.status]}
                  </span>
                  <span style={styles.participants}>
                    {registrations.filter(r => r.tournamentId === tournament.id).length}/{tournament.maxParticipants}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div style={styles.main}>
          {!selectedTournament ? (
            <div style={styles.empty}>
              <div style={styles.emptyTitle}>Selecciona un torneo</div>
              <div style={styles.emptySub}>Elige un torneo de la lista para ver sus inscripciones</div>
            </div>
          ) : (
            <>
              <div style={styles.header}>
                <div>
                  <h2 style={styles.tournamentTitle}>{selectedTournamentData?.name}</h2>
                  <div style={styles.tournamentInfo}>
                    <span>Categoría: {selectedTournamentData?.category.replace(/_/g, ' ')}</span>
                    <span>Tipo: {selectedTournamentData?.type}</span>
                    <span>Cupos: {selectedTournamentData?.maxParticipants}</span>
                  </div>
                </div>
                {selectedTournamentData?.status === 'REGISTRATION_OPEN' && (
                  <button style={styles.addBtn} onClick={() => setShowModal(true)}>
                    + Inscribir Jugador
                  </button>
                )}
              </div>

              {selectedTournamentData?.status !== 'REGISTRATION_OPEN' && (
                <div style={styles.warning}>
                  Las inscripciones están cerradas para este torneo
                </div>
              )}

              <div style={styles.tableHead}>
                <span>#</span>
                <span>Jugador</span>
                <span>País</span>
                <span>Puntos</span>
                <span>Fecha Inscripción</span>
                <span>Acciones</span>
              </div>

              {isLoading ? (
                <div style={styles.empty}><div style={styles.emptyTitle}>Cargando...</div></div>
              ) : registrations.length === 0 ? (
                <div style={styles.empty}>
                  <div style={styles.emptyTitle}>Sin inscripciones</div>
                  <div style={styles.emptySub}>No hay jugadores'inscriptiones en este torneo</div>
                </div>
              ) : (
                registrations.map((reg, idx) => {
                  const player = players.find(p => p.id === reg.playerId);
                  return (
                    <div key={reg.id} style={styles.row}>
                      <div style={styles.rank}>{idx + 1}</div>
                      <div style={styles.playerCell}>
                        <div style={styles.avatar}>
                          {player ? `${player.firstName[0]}${player.lastName[0]}`.toUpperCase() : '??'}
                        </div>
                        <div>
                          <div style={styles.playerName}>
                            {player ? `${player.firstName} ${player.lastName}` : 'Desconocido'}
                          </div>
                          <div style={styles.playerEmail}>{player?.email}</div>
                        </div>
                      </div>
                      <div style={styles.country}>{player?.nationality}</div>
                      <div style={styles.points}>{player?.rankingPoints}</div>
                      <div style={styles.date}>
                        {new Date(reg.registeredAt).toLocaleDateString('es-AR')}
                      </div>
                      <div style={styles.actions}>
                        <button
                          style={styles.deleteBtn}
                          onClick={() => {
                            if (confirm('¿Cancelar inscripción?')) {
                              deleteMutation.mutate({ tournamentId: selectedTournament, playerId: reg.playerId });
                            }
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>
      </div>

      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Inscribir Jugador</h2>
              <button style={styles.modalClose} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div style={styles.playerList}>
              {availablePlayers.length === 0 ? (
                <div style={styles.noPlayers}>No hay jugadores disponibles para inscribir</div>
              ) : (
                availablePlayers.map(player => (
                  <div
                    key={player.id}
                    style={styles.playerOption}
                    onClick={() => handleSubmit(player.id)}
                  >
                    <div style={styles.playerOptionAvatar}>
                      {`${player.firstName[0]}${player.lastName[0]}`.toUpperCase()}
                    </div>
                    <div style={styles.playerOptionInfo}>
                      <div style={styles.playerOptionName}>{player.firstName} {player.lastName}</div>
                      <div style={styles.playerOptionMeta}>{player.nationality} · {player.rankingPoints} pts</div>
                    </div>
                    <button style={styles.selectBtn}>+</button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { fontFamily: "'Barlow', system-ui, sans-serif", background: COLORS.bg, color: COLORS.text, minHeight: '100vh' },
  nav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', height: '60px', borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bg, position: 'sticky', top: 0, zIndex: 100 },
  logo: { display: 'flex', alignItems: 'center', gap: '10px' },
  logoDiamond: { width: '28px', height: '28px', background: COLORS.gold, transform: 'rotate(45deg)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoDiamondSpan: { transform: 'rotate(-45deg)', fontSize: '14px', fontWeight: 700, color: COLORS.bg, display: 'block' },
  logoText: { fontSize: '16px', fontWeight: 700, color: COLORS.text, letterSpacing: '1px' },
  navLinks: { display: 'flex', gap: '32px' },
  navLink: { fontSize: '11px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: COLORS.textMuted, cursor: 'pointer', border: 'none', background: 'none', transition: 'color 0.2s', padding: 0, textDecoration: 'none' },
  navLinkActive: { color: COLORS.gold },
  pageHeader: { padding: '40px 40px 32px', borderBottom: `1px solid ${COLORS.border}` },
  breadcrumb: { fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: '#3A3A3A', marginBottom: '12px' },
  pageTitle: { fontFamily: "'Playfair Display', serif", fontSize: '40px', fontWeight: 900, color: COLORS.text, margin: 0 },
  pageCount: { fontSize: '12px', color: '#3A3A3A', letterSpacing: '1px', marginTop: '6px' },
  content: { display: 'flex', minHeight: 'calc(100vh - 200px)' },
  sidebar: { width: '320px', borderRight: `1px solid ${COLORS.border}`, padding: '20px', background: '#080808' },
  sidebarTitle: { fontSize: '12px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: COLORS.textMuted, marginBottom: '16px' },
  tournamentList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  tournamentItem: { display: 'flex', flexDirection: 'column', gap: '6px', padding: '12px', background: 'transparent', border: `1px solid ${COLORS.border}`, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' },
  tournamentItemActive: { borderColor: COLORS.gold, background: `${COLORS.gold}08` },
  tournamentName: { fontSize: '14px', fontWeight: 600, color: COLORS.text },
  tournamentMeta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { fontSize: '10px', color: COLORS.textMuted, textTransform: 'uppercase' },
  participants: { fontSize: '11px', color: COLORS.gold },
  main: { flex: 1, padding: '24px 40px' },
  empty: { padding: '64px 0', textAlign: 'center' },
  emptyTitle: { fontFamily: "'Playfair Display', serif", fontSize: '24px', color: '#2A2A2A', marginBottom: '8px' },
  emptySub: { fontSize: '13px', color: '#3A3A3A', letterSpacing: '1px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  tournamentTitle: { fontSize: '24px', fontWeight: 700, color: COLORS.text, margin: '0 0 8px' },
  tournamentInfo: { display: 'flex', gap: '16px', fontSize: '12px', color: COLORS.textMuted },
  addBtn: { background: COLORS.gold, color: COLORS.bg, padding: '10px 20px', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer', border: 'none' },
  warning: { background: '#3A2A1A', border: '1px solid #6A4A2A', color: '#D4A574', padding: '12px 16px', marginBottom: '16px' },
  tableHead: { display: 'grid', gridTemplateColumns: '50px 1fr 80px 80px 120px 60px', padding: '14px 0', borderBottom: `1px solid ${COLORS.border}` },
  row: { display: 'grid', gridTemplateColumns: '50px 1fr 80px 80px 120px 60px', padding: '16px 0', borderBottom: '1px solid #0F0F0F', alignItems: 'center' },
  rank: { fontSize: '14px', color: COLORS.textMuted },
  playerCell: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: { width: '36px', height: '36px', background: '#111', border: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: COLORS.gold },
  playerName: { fontSize: '14px', fontWeight: 600, color: COLORS.text },
  playerEmail: { fontSize: '11px', color: COLORS.textMuted },
  country: { fontSize: '13px', color: '#5A5A5A' },
  points: { fontSize: '13px', color: COLORS.gold },
  date: { fontSize: '12px', color: '#5A5A5A' },
  actions: { display: 'flex', gap: '8px' },
  deleteBtn: { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', opacity: 0.6 },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modalContent: { background: '#0F0F0F', border: `1px solid ${COLORS.border}`, width: '100%', maxWidth: '480px', padding: '24px', maxHeight: '80vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  modalTitle: { fontSize: '20px', fontWeight: 700, color: COLORS.text, margin: 0 },
  modalClose: { background: 'transparent', border: 'none', color: COLORS.textMuted, fontSize: '18px', cursor: 'pointer' },
  playerList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  noPlayers: { textAlign: 'center', color: COLORS.textMuted, padding: '20px' },
  playerOption: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#080808', border: `1px solid ${COLORS.border}`, cursor: 'pointer' },
  playerOptionAvatar: { width: '40px', height: '40px', background: '#111', border: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: COLORS.gold },
  playerOptionInfo: { flex: 1 },
  playerOptionName: { fontSize: '14px', fontWeight: 600, color: COLORS.text },
  playerOptionMeta: { fontSize: '11px', color: COLORS.textMuted },
  selectBtn: { background: COLORS.gold, color: COLORS.bg, border: 'none', width: '32px', height: '32px', fontSize: '18px', cursor: 'pointer', borderRadius: '4px' },
};