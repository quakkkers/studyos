import { useState } from 'react';

export default function Calendar({ lessons, onSelectDate, selectedDate, accentColor }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const getLessonForDate = (day) => {
    const dateStr = new Date(year, month, day).toISOString().split('T')[0];
    return lessons.filter(l => l.date.split('T')[0] === dateStr);
  };

  const isToday = (day) => {
    const today = new Date();
    return today.getDate() === day &&
           today.getMonth() === month &&
           today.getFullYear() === year;
  };

  const isSelected = (day) => {
    if (!selectedDate) return false;
    const selDate = new Date(selectedDate);
    return selDate.getDate() === day &&
           selDate.getMonth() === month &&
           selDate.getFullYear() === year;
  };

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} style={{padding:8}} />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayLessons = getLessonForDate(day);
    const today = isToday(day);
    const selected = isSelected(day);
    const hasPast = dayLessons.some(l => new Date(l.date) < new Date() && !today);
    const hasUpcoming = dayLessons.some(l => new Date(l.date) >= new Date() || today);

    days.push(
      <button
        key={day}
        onClick={() => {
          const dateObj = new Date(year, month, day);
          onSelectDate(dateObj);
        }}
        style={{
          padding: '8px',
          border: today ? `2px solid ${accentColor}` : selected ? `2px solid ${accentColor}` : '1px solid var(--paper2)',
          background: today ? 'var(--sky-bg)' : selected ? 'var(--paper)' : dayLessons.length > 0 ? 'var(--white)' : 'transparent',
          borderRadius: 8,
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: today ? 700 : 500,
          color: today ? 'var(--ink)' : 'var(--ink2)',
          position: 'relative',
          minHeight: 40,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s',
          opacity: dayLessons.length > 0 ? 1 : 0.5
        }}
        onMouseEnter={(e) => {
          if (!today && !selected) {
            e.currentTarget.style.background = 'var(--paper)';
          }
        }}
        onMouseLeave={(e) => {
          if (!today && !selected) {
            e.currentTarget.style.background = dayLessons.length > 0 ? 'var(--white)' : 'transparent';
          }
        }}
      >
        <div>{day}</div>
        {dayLessons.length > 0 && (
          <div style={{display:'flex',gap:2,marginTop:4}}>
            {hasPast && (
              <div style={{width:6,height:6,borderRadius:'50%',background:'var(--green)'}} />
            )}
            {hasUpcoming && (
              <div style={{width:6,height:6,borderRadius:'50%',background:accentColor}} />
            )}
          </div>
        )}
      </button>
    );
  }

  const monthNames = ["January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"];

  return (
    <div style={{background:'var(--white)',border:'1px solid var(--paper2)',borderRadius:12,padding:16}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <button
          onClick={previousMonth}
          className="btn btn-ghost btn-sm"
          style={{fontSize:18}}
        >
          ▲
        </button>
        <h3 style={{fontSize:16,fontWeight:600,color:'var(--ink)'}}>
          {monthNames[month]} {year}
        </h3>
        <button
          onClick={nextMonth}
          className="btn btn-ghost btn-sm"
          style={{fontSize:18}}
        >
          ▼
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 4,
        marginBottom: 8
      }}>
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div
            key={day}
            style={{
              textAlign: 'center',
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--ink3)',
              padding: '8px 4px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            {day}
          </div>
        ))}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 4
      }}>
        {days}
      </div>
    </div>
  );
}
