import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { logActivity } from "@/lib/activityLog";
import type { Sample, SampleStatus, SampleCondition } from "@/types";

export function useSamples() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data: samples = [], isLoading } = useQuery({
    queryKey: ["samples", user?.id, user?.role],
    queryFn: async () => {
      let query = supabase
        .from("samples")
        .select("*, profiles(full_name, company)")
        .order("created_at", { ascending: false });

      if (user?.role === "customer") {
        query = query.eq("customer_id", user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Sample[];
    },
    enabled: !!user,
  });

  const { data: sample, isLoading: isSampleLoading } = useQuery({
    queryKey: ["sample"],
    queryFn: async () => null,
    enabled: false,
  });

  const fetchSampleById = async (id: string) => {
    const { data, error } = await supabase
      .from("samples")
      .select("*, profiles(full_name, company)")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("fetchSampleById error:", error);
      throw error;
    }
    return data as Sample;
  };

  const createSample = useMutation({
    mutationFn: async (
      newSample: Omit<Sample, "id" | "created_at" | "customer_name" | "customer_company">
    ) => {
      const { data, error } = await supabase
        .from("samples")
        .insert(newSample)
        .select()
        .single();
      if (error) {
        console.error("createSample error:", error);
        throw error;
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["samples"] });

      if (user) {
        logActivity({
          actor_id: user.id,
          actor_name: user.full_name || "Unknown",
          actor_role: user.role,
          action: "created sample",
          sample_id: data.sample_id,
          details: `Sample ${data.sample_id} submitted for project: ${data.project_name}`,
          page: "submit-sample",
        });
      }
    },
  });

  const updateSample = useMutation({
    mutationFn: async ({
      id,
      updates,
      previousSample,
    }: {
      id: string;
      updates: Partial<{
        status: SampleStatus;
        condition: SampleCondition;
        notes: string;
        awb_number: string;
        courier_name: string;
        received_at: string;
        pickup_date: string;
        dispatched_at: string;
        at_courier_at: string;
        in_transit_at: string;
      }>;
      previousSample?: Sample;
    }) => {
      const { error } = await supabase
        .from("samples")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
      return { id, updates, previousSample };
    },
    onSuccess: ({ updates, previousSample }) => {
      queryClient.invalidateQueries({ queryKey: ["samples"] });

      if (!user) return;

      // ✅ Log status change
      if (updates.status && previousSample) {
        logActivity({
          actor_id: user.id,
          actor_name: user.full_name || "Unknown",
          actor_role: user.role,
          action: "updated sample status",
          sample_id: previousSample.sample_id,
          old_value: previousSample.status,
          new_value: updates.status,
          details: `Status changed from "${previousSample.status}" → "${updates.status}"`,
          page: "dashboard",
        });
      }

      // ✅ Log courier update
      if (updates.courier_name || updates.awb_number) {
        logActivity({
          actor_id: user.id,
          actor_name: user.full_name || "Unknown",
          actor_role: user.role,
          action: "updated courier details",
          sample_id: previousSample?.sample_id,
          old_value: previousSample?.courier_name || "",
          new_value: updates.courier_name || previousSample?.courier_name || "",
          details: `Courier: ${updates.courier_name || "-"}, AWB: ${updates.awb_number || "-"}`,
          page: "dashboard",
        });
      }

      // ✅ Log notes update
      if (updates.notes) {
        logActivity({
          actor_id: user.id,
          actor_name: user.full_name || "Unknown",
          actor_role: user.role,
          action: "updated sample notes",
          sample_id: previousSample?.sample_id,
          old_value: previousSample?.notes || "(empty)",
          new_value: updates.notes,
          page: "dashboard",
        });
      }
    },
  });

  return {
    samples,
    sample,
    isLoading,
    isSampleLoading,
    fetchSampleById,
    createSample,
    updateSample,
  };
}