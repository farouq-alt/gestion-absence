import { useState, useMemo } from 'react'
import { MdBarChart, MdEmojiEvents } from 'react-icons/md'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
)

// Mock data - in a real app this would come from props or context
const STAGIAIRES = [
  { id: 1, cef: 'CEF001', nom: 'ALAMI Mohammed', email: 'alami.m@ofppt.ma', groupeId: 1, noteDiscipline: 20 },
  { id: 2, cef: 'CEF002', nom: 'BENALI Fatima', email: 'benali.f@ofppt.ma', groupeId: 1, noteDiscipline: 18 },
  { id: 3, cef: 'CEF003', nom: 'CHAKIR Ahmed', email: 'chakir.a@ofppt.ma', groupeId: 1, noteDiscipline: 20 },
  { id: 4, cef: 'CEF004', nom: 'DAHBI Sara', email: 'dahbi.s@ofppt.ma', groupeId: 1, noteDiscipline: 16 },
  { id: 5, cef: 'CEF005', nom: 'EL FASSI Youssef', email: 'elfassi.y@ofppt.ma', groupeId: 1, noteDiscipline: 20 },
  { id: 6, cef: 'CEF006', nom: 'FILALI Khadija', email: 'filali.k@ofppt.ma', groupeId: 2, noteDiscipline: 19 },
  { id: 7, cef: 'CEF007', nom: 'GHALI Omar', email: 'ghali.o@ofppt.ma', groupeId: 2, noteDiscipline: 20 },
  { id: 8, cef: 'CEF008', nom: 'HAMIDI Laila', email: 'hamidi.l@ofppt.ma', groupeId: 3, noteDiscipline: 17 },
  { id: 9, cef: 'CEF009', nom: 'IDRISSI Rachid', email: 'idrissi.r@ofppt.ma', groupeId: 4, noteDiscipline: 20 },
  { id: 10, cef: 'CEF010', nom: 'JABRI Amina', email: 'jabri.a@ofppt.ma', groupeId: 5, noteDiscipline: 20 },
]

const GROUPES = [
  { id: 1, nom: 'DEV101', filiereId: 1 },
  { id: 2, nom: 'DEV102', filiereId: 1 },
  { id: 3, nom: 'INF101', filiereId: 2 },
  { id: 4, nom: 'ELM101', filiereId: 3 },
  { id: 5, nom: 'GE101', filiereId: 5 },
  { id: 6, nom: 'CPT101', filiereId: 6 },
]

// Generate sample absence data for demonstration
const generateSampleAbsences = () => {
  const absences = []
  const startDate = new Date('2024-09-01') // Start of academic year
  const endDate = new Date('2025-01-31') // Current period
  
  STAGIAIRES.forEach(student => {
    // Generate random absences for each student
    const numAbsences = Math.floor(Math.random() * 15) // 0-14 absences per student
    
    for (let i = 0; i < numAbsences; i++) {
      const randomDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()))
      const duration = Math.random() > 0.7 ? 5 : 2.5 // 70% chance of 2.5h, 30% chance of 5h
      const isJustified = Math.random() > 0.4 // 60% chance of justified
      
      absences.push({
        id: absences.length + 1,
        stagiaireId: student.id,
        date: randomDate.toISOString().split('T')[0],
        duree: duration,
        etat: isJustified ? 'J' : 'NJ',
        recordedBy: 'teacher1',
        recordedAt: randomDate.toISOString()
      })
    }
  })
  
  return absences.sort((a, b) => new Date(a.date) - new Date(b.date))
}

function AbsenceAnalytics({ absences = generateSampleAbsences() }) {
  const [selectedStudent, setSelectedStudent] = useState('')
  const [chartType, setChartType] = useState('line') // 'line' or 'bar'
  const [timeRange, setTimeRange] = useState('6months') // '3months', '6months', '1year'
  const [showJustified, setShowJustified] = useState(true)
  const [showUnjustified, setShowUnjustified] = useState(true)

  // Helper functions
  const getStudentName = (stagiaireId) => {
    const student = STAGIAIRES.find(s => s.id === stagiaireId)
    return student ? student.nom : 'Stagiaire inconnu'
  }

  const getGroupName = (stagiaireId) => {
    const student = STAGIAIRES.find(s => s.id === stagiaireId)
    if (!student) return 'N/A'
    
    const group = GROUPES.find(g => g.id === student.groupeId)
    return group ? group.nom : 'N/A'
  }

  // Calculate date range based on selection
  const getDateRange = () => {
    const endDate = new Date()
    const startDate = new Date()
    
    switch (timeRange) {
      case '3months':
        startDate.setMonth(endDate.getMonth() - 3)
        break
      case '6months':
        startDate.setMonth(endDate.getMonth() - 6)
        break
      case '1year':
        startDate.setFullYear(endDate.getFullYear() - 1)
        break
      default:
        startDate.setMonth(endDate.getMonth() - 6)
    }
    
    return { startDate, endDate }
  }

  // Filter absences by date range and student
  const filteredAbsences = useMemo(() => {
    const { startDate, endDate } = getDateRange()
    
    return absences.filter(absence => {
      const absenceDate = new Date(absence.date)
      const inDateRange = absenceDate >= startDate && absenceDate <= endDate
      const matchesStudent = !selectedStudent || absence.stagiaireId === parseInt(selectedStudent)
      
      return inDateRange && matchesStudent
    })
  }, [absences, selectedStudent, timeRange, getDateRange])

  // Calculate analytics data
  const analyticsData = useMemo(() => {
    if (!selectedStudent) {
      return null
    }

    const studentAbsences = filteredAbsences.filter(a => a.stagiaireId === parseInt(selectedStudent))
    
    if (studentAbsences.length === 0) {
      return {
        totalAbsences: 0,
        justifiedAbsences: 0,
        unjustifiedAbsences: 0,
        totalHours: 0,
        attendanceRate: 100,
        trend: 'stable',
        monthlyData: []
      }
    }

    const totalAbsences = studentAbsences.length
    const justifiedAbsences = studentAbsences.filter(a => a.etat === 'J').length
    const unjustifiedAbsences = studentAbsences.filter(a => a.etat === 'NJ').length
    const totalHours = studentAbsences.reduce((sum, a) => sum + (typeof a.duree === 'number' ? a.duree : (a.duree === 1 ? 2.5 : 5)), 0)
    
    // Calculate attendance rate (assuming 30 hours per week, 20 weeks in period)
    const totalPossibleHours = 600 // Rough estimate
    const attendanceRate = Math.max(0, Math.round(((totalPossibleHours - totalHours) / totalPossibleHours) * 100))
    
    // Group by month for chart data
    const monthlyData = {}
    studentAbsences.forEach(absence => {
      const date = new Date(absence.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          justified: 0,
          unjustified: 0,
          totalHours: 0
        }
      }
      
      if (absence.etat === 'J') {
        monthlyData[monthKey].justified++
      } else {
        monthlyData[monthKey].unjustified++
      }
      
      monthlyData[monthKey].totalHours += typeof absence.duree === 'number' ? absence.duree : (absence.duree === 1 ? 2.5 : 5)
    })

    // Calculate trend (simplified)
    const months = Object.keys(monthlyData).sort()
    let trend = 'stable'
    if (months.length >= 2) {
      const firstHalf = months.slice(0, Math.ceil(months.length / 2))
      const secondHalf = months.slice(Math.floor(months.length / 2))
      
      const firstHalfAvg = firstHalf.reduce((sum, month) => sum + (monthlyData[month].justified + monthlyData[month].unjustified), 0) / firstHalf.length
      const secondHalfAvg = secondHalf.reduce((sum, month) => sum + (monthlyData[month].justified + monthlyData[month].unjustified), 0) / secondHalf.length
      
      if (secondHalfAvg > firstHalfAvg * 1.2) {
        trend = 'declining'
      } else if (secondHalfAvg < firstHalfAvg * 0.8) {
        trend = 'improving'
      }
    }

    return {
      totalAbsences,
      justifiedAbsences,
      unjustifiedAbsences,
      totalHours,
      attendanceRate,
      trend,
      monthlyData: Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month))
    }
  }, [filteredAbsences, selectedStudent])

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!analyticsData || analyticsData.monthlyData.length === 0) {
      return null
    }

    const labels = analyticsData.monthlyData.map(data => {
      const [year, month] = data.month.split('-')
      const date = new Date(year, month - 1)
      return date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
    })

    const datasets = []
    
    if (showJustified) {
      datasets.push({
        label: 'Absences Justifiées',
        data: analyticsData.monthlyData.map(data => data.justified),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        tension: 0.1
      })
    }
    
    if (showUnjustified) {
      datasets.push({
        label: 'Absences Non Justifiées',
        data: analyticsData.monthlyData.map(data => data.unjustified),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        tension: 0.1
      })
    }

    return {
      labels,
      datasets
    }
  }, [analyticsData, showJustified, showUnjustified])

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: selectedStudent ? `Historique des absences - ${getStudentName(parseInt(selectedStudent))}` : 'Sélectionnez un stagiaire'
      },
      tooltip: {
        callbacks: {
          afterLabel: function(context) {
            const dataIndex = context.dataIndex
            const monthData = analyticsData?.monthlyData[dataIndex]
            if (monthData) {
              return `Total heures: ${monthData.totalHours}h`
            }
            return ''
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Nombre d\'absences'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Période'
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  }

  return (
    <div className="absence-analytics">
      <div className="analytics-header">
        <h2>Analyse des Absences</h2>
        <p className="analytics-description">
          Visualisez l'historique des absences des stagiaires avec des graphiques interactifs et des statistiques détaillées.
        </p>
      </div>

      {/* Controls */}
      <div className="analytics-controls">
        <div className="control-group">
          <label htmlFor="student-select">Stagiaire</label>
          <select
            id="student-select"
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="control-select"
          >
            <option value="">-- Sélectionner un stagiaire --</option>
            {STAGIAIRES.map(student => (
              <option key={student.id} value={student.id}>
                {student.nom} ({student.cef}) - {getGroupName(student.id)}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="time-range-select">Période</label>
          <select
            id="time-range-select"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="control-select"
          >
            <option value="3months">3 derniers mois</option>
            <option value="6months">6 derniers mois</option>
            <option value="1year">1 dernière année</option>
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="chart-type-select">Type de graphique</label>
          <select
            id="chart-type-select"
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="control-select"
          >
            <option value="line">Courbe</option>
            <option value="bar">Barres</option>
          </select>
        </div>

        <div className="control-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showJustified}
              onChange={(e) => setShowJustified(e.target.checked)}
            />
            Absences justifiées
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showUnjustified}
              onChange={(e) => setShowUnjustified(e.target.checked)}
            />
            Absences non justifiées
          </label>
        </div>
      </div>

      {/* Analytics Content */}
      {selectedStudent ? (
        <div className="analytics-content">
          {/* Statistics Cards */}
          {analyticsData && (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{analyticsData.totalAbsences}</div>
                <div className="stat-label">Total Absences</div>
              </div>
              <div className="stat-card justified">
                <div className="stat-number">{analyticsData.justifiedAbsences}</div>
                <div className="stat-label">Justifiées</div>
              </div>
              <div className="stat-card unjustified">
                <div className="stat-number">{analyticsData.unjustifiedAbsences}</div>
                <div className="stat-label">Non Justifiées</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{analyticsData.totalHours}h</div>
                <div className="stat-label">Total Heures</div>
              </div>
              <div className="stat-card attendance">
                <div className="stat-number">{analyticsData.attendanceRate}%</div>
                <div className="stat-label">Taux de Présence</div>
              </div>
              <div className={`stat-card trend ${analyticsData.trend}`}>
                <div className="stat-number">
                  {analyticsData.trend === 'improving' ? '↗️' : 
                   analyticsData.trend === 'declining' ? '↘️' : '→'}
                </div>
                <div className="stat-label">
                  {analyticsData.trend === 'improving' ? 'En amélioration' : 
                   analyticsData.trend === 'declining' ? 'En dégradation' : 'Stable'}
                </div>
              </div>
            </div>
          )}

          {/* Chart */}
          <div className="chart-container">
            {chartData && (showJustified || showUnjustified) ? (
              <div className="chart-wrapper">
                {chartType === 'line' ? (
                  <Line data={chartData} options={chartOptions} />
                ) : (
                  <Bar data={chartData} options={chartOptions} />
                )}
              </div>
            ) : (
              <div className="chart-empty-state">
                {!chartData ? (
                  <div>
                    <div className="empty-state-icon"><MdBarChart size={48} /></div>
                    <h3>Aucune donnée disponible</h3>
                    <p>Ce stagiaire n'a aucune absence dans la période sélectionnée.</p>
                    <div className="perfect-attendance">
                      <span className="perfect-attendance-icon"><MdEmojiEvents size={32} /></span>
                      <span className="perfect-attendance-text">Assiduité parfaite!</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="empty-state-icon">👁️</div>
                    <h3>Aucun type d'absence sélectionné</h3>
                    <p>Cochez au moins une option (justifiées ou non justifiées) pour afficher le graphique.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="analytics-empty-state">
          <div className="empty-state-icon">📈</div>
          <h3>Sélectionnez un stagiaire</h3>
          <p>Choisissez un stagiaire dans la liste déroulante pour visualiser son historique d'absences.</p>
          <p>Les graphiques montreront l'évolution des absences justifiées et non justifiées sur la période sélectionnée.</p>
        </div>
      )}
    </div>
  )
}

export default AbsenceAnalytics