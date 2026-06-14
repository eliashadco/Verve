create or replace function public.create_direct_conversation(other_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  conv_id uuid;
  direct_key text;
begin
  if other_id is null or other_id = auth.uid() then
    raise exception 'invalid other_id';
  end if;
  if not (is_linked(auth.uid(), other_id) or is_linked(other_id, auth.uid())) then
    raise exception 'not linked';
  end if;
  direct_key := (select string_agg(id::text, ':' order by id) from (values (auth.uid()), (other_id)) as t(id));
  select c.id into conv_id from conversations c where c.type = 'direct' and c.direct_key = direct_key limit 1;
  if conv_id is not null then return conv_id; end if;
  insert into conversations (type, direct_key) values ('direct', direct_key) returning id into conv_id;
  insert into conversation_members (conversation_id, user_id, role) values
    (conv_id, auth.uid(), 'admin'),
    (conv_id, other_id, 'member');
  return conv_id;
end $$;

grant execute on function public.create_direct_conversation(uuid) to authenticated;
