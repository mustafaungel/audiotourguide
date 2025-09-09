-- Fix remaining security warnings

-- Fix function search path mutability
ALTER FUNCTION public.get_masked_verification_request(uuid) SET search_path = 'public';
ALTER FUNCTION public.handle_new_user() SET search_path = 'public';
ALTER FUNCTION public.update_guide_rating() SET search_path = 'public';
ALTER FUNCTION public.is_admin(uuid) SET search_path = 'public';
ALTER FUNCTION public.update_creator_ratings() SET search_path = 'public';
ALTER FUNCTION public.approve_creator_verification(uuid, text) SET search_path = 'public';
ALTER FUNCTION public.reject_creator_verification(uuid, text, text) SET search_path = 'public';
ALTER FUNCTION public.track_guide_view(uuid) SET search_path = 'public';
ALTER FUNCTION public.log_security_event(uuid, text, text, uuid, boolean, text, jsonb) SET search_path = 'public';
ALTER FUNCTION public.verify_access_code_secure(text, uuid) SET search_path = 'public';
ALTER FUNCTION public.get_guest_purchase_info(text, uuid) SET search_path = 'public';
ALTER FUNCTION public.get_verification_document_url(text, integer) SET search_path = 'public';
ALTER FUNCTION public.cleanup_verification_documents(uuid) SET search_path = 'public';
ALTER FUNCTION public.log_verification_document_access() SET search_path = 'public';
ALTER FUNCTION public.get_masked_guest_email(uuid, text) SET search_path = 'public';
ALTER FUNCTION public.get_safe_verification_request(uuid) SET search_path = 'public';
ALTER FUNCTION public.admin_get_verification_requests() SET search_path = 'public';
ALTER FUNCTION public.auto_generate_slug() SET search_path = 'public';
ALTER FUNCTION public.secure_delete_verification_documents(uuid) SET search_path = 'public';
ALTER FUNCTION public.audit_verification_document_changes() SET search_path = 'public';
ALTER FUNCTION public.can_access_verification_documents(uuid) SET search_path = 'public';
ALTER FUNCTION public.generate_slug(text, text) SET search_path = 'public';
ALTER FUNCTION public.validate_verification_document_access(text) SET search_path = 'public';
ALTER FUNCTION public.track_viral_share(uuid, text, text) SET search_path = 'public';
ALTER FUNCTION public.secure_verification_document_access(text, text) SET search_path = 'public';
ALTER FUNCTION public.audit_verification_operation(text, text, uuid, jsonb) SET search_path = 'public';
ALTER FUNCTION public.log_verification_document_updates() SET search_path = 'public';
ALTER FUNCTION public.generate_access_code() SET search_path = 'public';
ALTER FUNCTION public.update_purchase_count() SET search_path = 'public';
ALTER FUNCTION public.update_verification_requests_updated_at() SET search_path = 'public';
ALTER FUNCTION public.connect_user_to_creator() SET search_path = 'public';
ALTER FUNCTION public.update_updated_at_column() SET search_path = 'public';
ALTER FUNCTION public.has_verification_document_access(uuid, text) SET search_path = 'public';
ALTER FUNCTION public.mask_verification_data(text, uuid, text) SET search_path = 'public';