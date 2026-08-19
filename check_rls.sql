SELECT pol.polname, pol.polcmd, pol.polqual 
FROM pg_policy pol
JOIN pg_class tbl ON pol.polrelid = tbl.oid
WHERE tbl.relname = 'submissions';
