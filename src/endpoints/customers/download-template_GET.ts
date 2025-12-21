export async function handle(request: Request): Promise<Response> {
  const headers = [
    'firstName',
    'lastName',
    'email',
    'idType',
    'idNumber',
    'mobile',
    'locationId',
    'apartment',
    'birthDate'
  ];

  const exampleRows = [
    ['Juan', 'Perez', 'juan.perez@example.co', 'CC', '1020304050', '3101234567', '1', 'Apto 101', '1990-05-15'],
    ['Maria', 'Gomez', 'maria.gomez@example.co', 'CC', '1098765432', '3207654321', '1', 'Torre 2 Apto 502', '1985-11-22']
  ];

  const csvContent = [
    headers.join(','),
    ...exampleRows.map(row => row.join(','))
  ].join('\n');

  return new Response(csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="customer_template.csv"',
    },
  });
}