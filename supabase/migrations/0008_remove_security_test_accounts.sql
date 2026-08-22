-- Cleanup: removes the two throwaway accounts created while verifying that the
-- invite-code gate in 0007 actually holds (one that requested role=commander
-- through the raw auth API and was correctly downgraded to learner, one that
-- presented a valid code). Their profiles cascade away with the auth rows.

delete from auth.users
where email in (
  'ivrit.machberet.attacker@gmail.com',
  'ivrit.machberet.invited@gmail.com'
);

-- the invite counter should reflect real commanders, not the test signup
update public.commander_invites set uses = 0 where uses > 0;
