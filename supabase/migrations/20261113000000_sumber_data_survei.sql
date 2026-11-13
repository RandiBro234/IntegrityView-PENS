-- Migrasi ADDITIVE untuk menandai asal data survei.
--
-- Kolom ini tidak dikembalikan oleh RPC dashboard, jadi tidak mengubah
-- tampilan frontend. Gunanya untuk audit dan cleanup data dummy:
--   delete from public.survey_responses where sumber_data = 'dummy';

alter table public.survey_responses
  add column if not exists sumber_data text not null default 'asli';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'survey_responses_sumber_data_check'
  ) then
    alter table public.survey_responses
      add constraint survey_responses_sumber_data_check
      check (sumber_data in ('asli', 'dummy'));
  end if;
end
$$;

create index if not exists idx_survey_responses_sumber_data
  on public.survey_responses (sumber_data, nama_instrumen, created_at desc);

comment on column public.survey_responses.sumber_data is
  'Asal baris: asli (data nyata) atau dummy (data demo yang bisa dihapus).';

notify pgrst, 'reload schema';
