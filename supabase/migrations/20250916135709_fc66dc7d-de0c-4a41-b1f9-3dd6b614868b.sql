-- Grant execute permission for access-validated RPCs to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.get_linked_guides_with_access(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_sections_with_access(uuid, text, text) TO anon, authenticated;