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

    const startDate = new Date(term.start_date);
    const endDate = new Date(term.end_date);

    let currentDate = new Date(startDate);
    while (currentDate.getDay() !== targetDay) {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    while (currentDate <= endDate) {
      lessons.push({
        term_id: term.id || null,
        lesson_number: lessonNumber++,
        date: currentDate.toISOString().split('T')[0]
      });

      currentDate.setDate(currentDate.getDate() + 7);
    }
  });

  return lessons;
}
