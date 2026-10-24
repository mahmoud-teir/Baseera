-- ── Support Stage 2 & Stage 3 Curricula in CMS & Lesson Keys ──────────────
-- Extends public.cms_check and public.admin_transition to accept any valid 2-letter uppercase lesson prefix
-- (e.g. ML, AH, MW, US, MH, WS, OT, AR, QD for Stage 2, and CF, AU, IL, TC, NW for Stage 3).

create or replace function public.cms_check(k text, slot text, d jsonb, p_publish boolean) returns text
language plpgsql immutable as $$
declare q jsonb; x jsonb; n int; ids text[] := '{}';
begin
  if jsonb_typeof(d) <> 'object' then return 'data_not_object'; end if;
  case k
  when 'lesson' then
    if slot !~ '^[A-Z]{2}-\d{2}$' then return 'bad_slot'; end if;
    if public.cms_blank(d->'title') then return 'title_required'; end if;
    if coalesce((d#>>'{quiz,passPct}')::int, 0) not between 50 and 100 then return 'pass_pct'; end if;
    for q in select * from jsonb_array_elements(coalesce(d#>'{quiz,questions}', '[]')) loop
      n := jsonb_array_length(coalesce(q->'options', '[]'));
      if public.cms_blank(q->'id') or q->>'id' = any (ids) then return 'question_id'; end if;
      ids := ids || (q->>'id');
      if public.cms_blank(q->'q') or n not between 2 and 6 or coalesce((q->>'answer')::int, -1) not between 0 and n - 1 then return 'question_invalid'; end if;
    end loop;
    if p_publish and (jsonb_array_length(coalesce(d->'objectives', '[]')) = 0 or jsonb_array_length(coalesce(d->'sections', '[]')) = 0
                      or jsonb_array_length(coalesce(d#>'{quiz,questions}', '[]')) = 0) then return 'lesson_incomplete'; end if;
  when 'evidence' then
    if slot !~ '^[A-Z]{2}-\d{2}/e\d+$' then return 'bad_slot'; end if;
    if p_publish and (public.cms_blank(d->'text') or public.cms_blank(d->'source')) then return 'source_required'; end if;
  when 'quote' then
    if p_publish and (public.cms_blank(d->'text') or public.cms_blank(d->'scholar') or public.cms_blank(d->'source')) then return 'source_required'; end if;
  when 'vocab' then
    if public.cms_blank(d->'word') or public.cms_blank(d->'meaning') then return 'word_required'; end if;
    if p_publish and (jsonb_array_length(coalesce(d->'ayahs', '[]')) = 0) then return 'source_required'; end if;
  when 'story', 'sharia' then
    if p_publish then
      n := 0;
      for x in select value from jsonb_each(coalesce(d->'sections', '{}')) loop
        if public.cms_blank(x->'text') or public.cms_blank(x->'source') then return 'source_required'; end if;
        n := n + 1;
      end loop;
      if n = 0 then return 'empty'; end if;
    end if;
  when 'adhkar' then
    for x in select * from jsonb_array_elements(coalesce(d->'items', '[]')) loop
      if public.cms_blank(x->'id') or x->>'id' = any (ids) then return 'item_id'; end if;
      ids := ids || (x->>'id');
      if p_publish and (public.cms_blank(x->'text') or public.cms_blank(x->'source') or coalesce((x->>'count')::int, 0) < 1) then return 'source_required'; end if;
    end loop;
    if p_publish and cardinality(ids) = 0 then return 'empty'; end if;
  when 'tafsir' then
    if slot !~ '^\d{1,3}$' or slot::int not between 1 and 114 then return 'bad_slot'; end if;
    if p_publish and (public.cms_blank(d->'intro') or jsonb_array_length(coalesce(d->'themes', '[]')) = 0) then return 'tafsir_incomplete'; end if;
  when 'tajweed' then
    if slot !~ '^\d+$' then return 'bad_slot'; end if;
    if p_publish and (public.cms_blank(d->'title') or public.cms_blank(d->'body')) then return 'empty'; end if;
  when 'drill' then
    if slot !~ '^\d+$' then return 'bad_slot'; end if;
    if p_publish and (public.cms_blank(d->'surah') or public.cms_blank(d->'ayah') or public.cms_blank(d->'rule')
                      or jsonb_array_length(coalesce(d->'options', '[]')) < 2 or coalesce((d->>'answer')::int, -1) < 0) then return 'drill_incomplete'; end if;
  when 'path' then
    if slot not in ('ramadan', 'hajj', 'salah', 'tazkiya') then return 'bad_slot'; end if;
    if p_publish and (public.cms_blank(d->'title') or jsonb_array_length(coalesce(d->'steps', '[]')) = 0) then return 'path_incomplete'; end if;
  when 'map' then
    if slot not in ('tawheed', 'aqeedah', 'taharah', 'recite', 'hadith', 'salah', 'tajweed', 'seerah', 'zakat', 'siyam', 'tafsir',
                    'mustalah', 'muamalat', 'hajj', 'arabic', 'mawarith', 'ahwal', 'usul', 'qada') then return 'bad_slot'; end if;
    if p_publish and jsonb_array_length(coalesce(d->'links', '[]')) = 0 then return 'empty'; end if;
  when 'page' then
    if slot !~ '^[1-9]\d{0,2}$' or slot::int not between 1 and 604 then return 'bad_slot'; end if;
    if p_publish and (jsonb_array_length(coalesce(d->'lines', '[]')) = 0 or jsonb_array_length(coalesce(d->'ayahs', '[]')) = 0) then return 'page_incomplete'; end if;
  when 'book', 'audio' then
    if p_publish and (public.cms_blank(d->'title') or public.cms_blank(d->'author') or public.cms_blank(d->'url')) then return 'source_required'; end if;
  else return 'unknown_kind';
  end case;
  return null;
end;
$$;

create or replace function public.admin_transition(p_kind text, p_id text, p_action text) returns text
language plpgsql security definer set search_path = public as $$
declare
  r public.content_items%rowtype;
  cur text;
  nxt text;
  err text;
  me text;
  need int;
  rep public.reports%rowtype;
  v_stage int;
  v_subject text;
  v_pfx text;
begin
  perform public.require_perm('view_queues');

  if p_kind = 'ct' then
    select * into r from public.content_items where id = p_id for update;
    if r.id is null then raise exception 'not_found'; end if;
    cur := r.status;
    if p_action = 'send' and cur = 'draft' then
      perform public.require_perm('edit_lessons');
      err := public.cms_check(r.kind, r.slot, r.data, true);
      if err is not null then raise exception '%', err using errcode = '22023'; end if;
      nxt := 'review';
      update public.content_items set status = nxt, approvals = '{}', approver_names = '{}' where id = p_id;
    elsif p_action = 'approve' and cur = 'review' then
      perform public.require_perm('approve_evidence');
      if auth.uid() = any (r.approvals) then raise exception 'already_approved' using errcode = '42501'; end if;
      err := public.cms_check(r.kind, r.slot, r.data, true);
      if err is not null then raise exception '%', err using errcode = '22023'; end if;
      select coalesce(nullif(p.display_name, ''), u.email::text) into me from auth.users u left join public.profiles p on p.id = u.id where u.id = auth.uid();
      r.approvals := r.approvals || auth.uid();
      r.approver_names := r.approver_names || coalesce(me, '—');
      need := case when r.kind = 'lesson' then 2 else 1 end;
      if cardinality(r.approvals) >= need then
        nxt := 'published';
        update public.content_items set status = nxt, approvals = r.approvals, approver_names = r.approver_names,
          published_data = r.data, published_at = now() where id = p_id;
        insert into public.changelog (item, summary, approved_by)
          values (coalesce(nullif(r.data->>'title', ''), r.kind || ' · ' || r.slot), case when r.published_data is null then 'نُشر' else 'حُدّث' end,
                  array_to_string(r.approver_names, '، '));
        if r.kind = 'lesson' then
          v_pfx := left(r.slot, 2);
          v_stage := case
            when v_pfx in ('AQ', 'FQ', 'TF', 'HD', 'SR', 'TZ') then 1
            when v_pfx in ('ML', 'AH', 'MW', 'US', 'MH', 'WS', 'OT', 'AR', 'QD') then 2
            else 3 end;
          v_subject := case v_pfx
            when 'AQ' then 'aqeedah' when 'FQ' then 'fiqh' when 'TF' then 'tafsir' when 'HD' then 'hadith' when 'SR' then 'seerah' when 'TZ' then 'tazkiyah'
            when 'ML' then 'muamalat' when 'AH' then 'ahwal' when 'MW' then 'mawarith' when 'US' then 'usul' when 'MH' then 'mustalah'
            when 'WS' then 'wasitiyyah' when 'OT' then 'usul_tafsir' when 'AR' then 'arabic' when 'QD' then 'qada'
            when 'CF' then 'comparative_fiqh' when 'AU' then 'advanced_usul' when 'IL' then 'hadith_ilal' when 'TC' then 'tafsir_comparative' when 'NW' then 'nawazil'
            else 'general' end;

          insert into public.lesson_keys (code, subject, stage, pass_pct, answers)
          values (r.slot,
                  v_subject,
                  v_stage,
                  (r.data#>>'{quiz,passPct}')::int,
                  array(select (q->>'answer')::int from jsonb_array_elements(r.data#>'{quiz,questions}') with ordinality as t(q, i) order by i))
          on conflict (code) do update set pass_pct = excluded.pass_pct, answers = excluded.answers, stage = excluded.stage, subject = excluded.subject;
        end if;
      else
        nxt := 'review';
        update public.content_items set approvals = r.approvals, approver_names = r.approver_names where id = p_id;
      end if;
    elsif p_action = 'reject' and cur = 'review' then
      perform public.require_perm('approve_evidence');
      nxt := 'rejected';
      update public.content_items set status = nxt, approvals = '{}', approver_names = '{}' where id = p_id;
    elsif p_action = 'reopen' and cur = 'rejected' then
      perform public.require_perm('edit_lessons');
      nxt := 'draft';
      update public.content_items set status = nxt where id = p_id;
    else
      raise exception 'invalid_transition %→%', cur, p_action using errcode = '42501';
    end if;

  elsif p_kind = 'rp' then
    perform public.require_perm('triage_reports');
    select * into rep from public.reports where id = p_id::bigint for update;
    if rep.id is null then raise exception 'not_found'; end if;
    cur := rep.status;
    nxt := case
      when p_action = 'triage' and cur = 'new' then 'triaged'
      when p_action = 'fixed' and cur = 'triaged' then 'fixed'
      when p_action = 'notify' and cur = 'fixed' then 'notified'
      when p_action = 'reject' and cur in ('new', 'triaged') then 'rejected'
      else null end;
    if nxt is null then raise exception 'invalid_transition %→%', cur, p_action using errcode = '42501'; end if;
    update public.reports set status = nxt where id = rep.id;
    if nxt = 'notified' and rep.user_id is not null then
      insert into public.user_notifications (user_id, report_id, title, body)
      values (rep.user_id, rep.id, 'أُصلح ما أبلغت عنه', 'شكرًا لك. راجع فريق المحتوى بلاغك عن «' || left(rep.where_text, 120) || '» وأصلحه.');
    end if;
  else
    raise exception 'unknown_kind';
  end if;

  perform public.audit(p_kind || ':' || p_id, cur || ' → ' || nxt);
  return nxt;
end;
$$;
