export function generateLessonsFromTerms(terms, lessonDay) {
  if (!lessonDay || !terms || terms.length === 0) {
    return [];
  }

  const dayMap = {
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
    sunday: 0
  };

  const targetDay = dayMap[lessonDay.toLowerCase()];
  if (targetDay === undefined) return [];

  const lessons = [];
  let lessonNumber = 1;

  terms.forEach(term => {
    if (!term.start_date || !term.end_date) return;

    const startDate = new Date(term.start_date + 'T00:00:00');
    const endDate = new Date(term.end_date + 'T00:00:00');

    let currentDate = new Date(startDate);
    while (currentDate.getDay() !== targetDay) {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');

      lessons.push({
        term_id: term.id || null,
        lesson_number: lessonNumber++,
        date: `${year}-${month}-${day}`
      });

      currentDate.setDate(currentDate.getDate() + 7);
    }
  });

  return lessons;
}
