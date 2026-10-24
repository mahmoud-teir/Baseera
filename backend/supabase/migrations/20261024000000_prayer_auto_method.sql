-- Default prayer calculation method: «Automatic» picks the method commonly used officially in the
-- location's country (the app maps country → method). Only replaces the original default.
update public.app_config
  set value = jsonb_set(value, '{method}', '"Automatic"'), updated_at = now()
  where key = 'prayer' and value->>'method' = 'Muslim World League';
