-- Allow service role to build Vesta payloads for admin push
GRANT EXECUTE ON FUNCTION public.build_vesta_payload_from_application(jsonb) TO service_role;
