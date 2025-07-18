PGDMP  *    2                }           Footadminsuite    17.5    17.5 +    3           0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                           false            4           0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                           false            5           0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                           false            6           1262    16388    Footadminsuite    DATABASE     �   CREATE DATABASE "Footadminsuite" WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'French_France.1252';
     DROP DATABASE "Footadminsuite";
                     postgres    false            �            1259    16392    client_id_client_seq    SEQUENCE     }   CREATE SEQUENCE public.client_id_client_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 +   DROP SEQUENCE public.client_id_client_seq;
       public               postgres    false            �            1259    16399    client    TABLE       CREATE TABLE public.client (
    id_client integer DEFAULT nextval('public.client_id_client_seq'::regclass) NOT NULL,
    nom_client character varying(75),
    prenom character varying(75),
    email character varying(75),
    statut character varying(50)
);
    DROP TABLE public.client;
       public         heap r       postgres    false    217            �            1259    16393    demo_id_demonstration_seq    SEQUENCE     �   CREATE SEQUENCE public.demo_id_demonstration_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 0   DROP SEQUENCE public.demo_id_demonstration_seq;
       public               postgres    false            �            1259    16405    demo    TABLE     	  CREATE TABLE public.demo (
    id_demonstration integer DEFAULT nextval('public.demo_id_demonstration_seq'::regclass) NOT NULL,
    nom character varying(75),
    email character varying(255),
    nombre_terrains integer,
    message text,
    date_demande date
);
    DROP TABLE public.demo;
       public         heap r       postgres    false    218            �            1259    16394 "   demonstration_id_demonstration_seq    SEQUENCE     �   CREATE SEQUENCE public.demonstration_id_demonstration_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 9   DROP SEQUENCE public.demonstration_id_demonstration_seq;
       public               postgres    false            �            1259    16413 
   demonstration    TABLE     �  CREATE TABLE public.demonstration (
    id_demonstration integer DEFAULT nextval('public.demonstration_id_demonstration_seq'::regclass) NOT NULL,
    nom character varying(75),
    email character varying(255),
    nombreterrains character varying(375),
    message text,
    entreprise character varying(255),
    date_demande timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    statut character varying(20) DEFAULT 'en_attente'::character varying NOT NULL
);
 !   DROP TABLE public.demonstration;
       public         heap r       postgres    false    219            �            1259    16395 #   demonstrations_id_demonstration_seq    SEQUENCE     �   CREATE SEQUENCE public.demonstrations_id_demonstration_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 :   DROP SEQUENCE public.demonstrations_id_demonstration_seq;
       public               postgres    false            �            1259    16421    demonstrations    TABLE     d  CREATE TABLE public.demonstrations (
    id_demonstration integer DEFAULT nextval('public.demonstrations_id_demonstration_seq'::regclass) NOT NULL,
    nom character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    nombreterrains integer NOT NULL,
    message text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);
 "   DROP TABLE public.demonstrations;
       public         heap r       postgres    false    220            �            1259    16469    partenariat    TABLE     �  CREATE TABLE public.partenariat (
    id_partenariat integer NOT NULL,
    nom character varying(255) NOT NULL,
    type character varying(250),
    date_debut date NOT NULL,
    date_fin date NOT NULL,
    contact character varying NOT NULL,
    statut character varying(10) DEFAULT 'active'::character varying,
    CONSTRAINT partenariat_statut_check CHECK (((statut)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying])::text[])))
);
    DROP TABLE public.partenariat;
       public         heap r       postgres    false            �            1259    16396    partenariat_id_partenariat_seq    SEQUENCE     �   CREATE SEQUENCE public.partenariat_id_partenariat_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 5   DROP SEQUENCE public.partenariat_id_partenariat_seq;
       public               postgres    false            �            1259    16468    partenariat_id_partenariat_seq1    SEQUENCE     �   CREATE SEQUENCE public.partenariat_id_partenariat_seq1
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 6   DROP SEQUENCE public.partenariat_id_partenariat_seq1;
       public               postgres    false    231            7           0    0    partenariat_id_partenariat_seq1    SEQUENCE OWNED BY     b   ALTER SEQUENCE public.partenariat_id_partenariat_seq1 OWNED BY public.partenariat.id_partenariat;
          public               postgres    false    230            �            1259    16397    reservation_id_reservation_seq    SEQUENCE     �   CREATE SEQUENCE public.reservation_id_reservation_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 5   DROP SEQUENCE public.reservation_id_reservation_seq;
       public               postgres    false            �            1259    16436    reservation    TABLE     �  CREATE TABLE public.reservation (
    id_reservation integer DEFAULT nextval('public.reservation_id_reservation_seq'::regclass) NOT NULL,
    formule character varying(75),
    prix numeric,
    prix_perso numeric,
    nom_complet character varying(75),
    entreprise text,
    type_perso character varying(255),
    fonctionnalite character varying(375),
    email character varying(75),
    total numeric,
    date date,
    statut character varying(20) DEFAULT 'en_attente'::character varying NOT NULL
);
    DROP TABLE public.reservation;
       public         heap r       postgres    false    222            �            1259    16398    utilisateur_id_utilisateur_seq    SEQUENCE     �   CREATE SEQUENCE public.utilisateur_id_utilisateur_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 5   DROP SEQUENCE public.utilisateur_id_utilisateur_seq;
       public               postgres    false            �            1259    16444    utilisateur    TABLE     7  CREATE TABLE public.utilisateur (
    id_utilisateur integer DEFAULT nextval('public.utilisateur_id_utilisateur_seq'::regclass) NOT NULL,
    nom character varying(75),
    email character varying(255),
    motdepasse character varying(255),
    role character varying(255),
    statut character varying(50)
);
    DROP TABLE public.utilisateur;
       public         heap r       postgres    false    223            �           2604    16472    partenariat id_partenariat    DEFAULT     �   ALTER TABLE ONLY public.partenariat ALTER COLUMN id_partenariat SET DEFAULT nextval('public.partenariat_id_partenariat_seq1'::regclass);
 I   ALTER TABLE public.partenariat ALTER COLUMN id_partenariat DROP DEFAULT;
       public               postgres    false    230    231    231            )          0    16399    client 
   TABLE DATA           N   COPY public.client (id_client, nom_client, prenom, email, statut) FROM stdin;
    public               postgres    false    224   �7       *          0    16405    demo 
   TABLE DATA           d   COPY public.demo (id_demonstration, nom, email, nombre_terrains, message, date_demande) FROM stdin;
    public               postgres    false    225   �8       +          0    16413 
   demonstration 
   TABLE DATA           �   COPY public.demonstration (id_demonstration, nom, email, nombreterrains, message, entreprise, date_demande, statut) FROM stdin;
    public               postgres    false    226   �8       ,          0    16421    demonstrations 
   TABLE DATA           k   COPY public.demonstrations (id_demonstration, nom, email, nombreterrains, message, created_at) FROM stdin;
    public               postgres    false    227   y:       0          0    16469    partenariat 
   TABLE DATA           g   COPY public.partenariat (id_partenariat, nom, type, date_debut, date_fin, contact, statut) FROM stdin;
    public               postgres    false    231   ;       -          0    16436    reservation 
   TABLE DATA           �   COPY public.reservation (id_reservation, formule, prix, prix_perso, nom_complet, entreprise, type_perso, fonctionnalite, email, total, date, statut) FROM stdin;
    public               postgres    false    228   �;       .          0    16444    utilisateur 
   TABLE DATA           [   COPY public.utilisateur (id_utilisateur, nom, email, motdepasse, role, statut) FROM stdin;
    public               postgres    false    229   t>       8           0    0    client_id_client_seq    SEQUENCE SET     C   SELECT pg_catalog.setval('public.client_id_client_seq', 17, true);
          public               postgres    false    217            9           0    0    demo_id_demonstration_seq    SEQUENCE SET     H   SELECT pg_catalog.setval('public.demo_id_demonstration_seq', 1, false);
          public               postgres    false    218            :           0    0 "   demonstration_id_demonstration_seq    SEQUENCE SET     Q   SELECT pg_catalog.setval('public.demonstration_id_demonstration_seq', 25, true);
          public               postgres    false    219            ;           0    0 #   demonstrations_id_demonstration_seq    SEQUENCE SET     R   SELECT pg_catalog.setval('public.demonstrations_id_demonstration_seq', 1, false);
          public               postgres    false    220            <           0    0    partenariat_id_partenariat_seq    SEQUENCE SET     M   SELECT pg_catalog.setval('public.partenariat_id_partenariat_seq', 1, false);
          public               postgres    false    221            =           0    0    partenariat_id_partenariat_seq1    SEQUENCE SET     N   SELECT pg_catalog.setval('public.partenariat_id_partenariat_seq1', 15, true);
          public               postgres    false    230            >           0    0    reservation_id_reservation_seq    SEQUENCE SET     M   SELECT pg_catalog.setval('public.reservation_id_reservation_seq', 43, true);
          public               postgres    false    222            ?           0    0    utilisateur_id_utilisateur_seq    SEQUENCE SET     M   SELECT pg_catalog.setval('public.utilisateur_id_utilisateur_seq', 30, true);
          public               postgres    false    223            �           2606    16404    client client_pkey 
   CONSTRAINT     W   ALTER TABLE ONLY public.client
    ADD CONSTRAINT client_pkey PRIMARY KEY (id_client);
 <   ALTER TABLE ONLY public.client DROP CONSTRAINT client_pkey;
       public                 postgres    false    224            �           2606    16412    demo demo_pkey 
   CONSTRAINT     Z   ALTER TABLE ONLY public.demo
    ADD CONSTRAINT demo_pkey PRIMARY KEY (id_demonstration);
 8   ALTER TABLE ONLY public.demo DROP CONSTRAINT demo_pkey;
       public                 postgres    false    225            �           2606    16420     demonstration demonstration_pkey 
   CONSTRAINT     l   ALTER TABLE ONLY public.demonstration
    ADD CONSTRAINT demonstration_pkey PRIMARY KEY (id_demonstration);
 J   ALTER TABLE ONLY public.demonstration DROP CONSTRAINT demonstration_pkey;
       public                 postgres    false    226            �           2606    16429 "   demonstrations demonstrations_pkey 
   CONSTRAINT     n   ALTER TABLE ONLY public.demonstrations
    ADD CONSTRAINT demonstrations_pkey PRIMARY KEY (id_demonstration);
 L   ALTER TABLE ONLY public.demonstrations DROP CONSTRAINT demonstrations_pkey;
       public                 postgres    false    227            �           2606    16478    partenariat partenariat_pkey 
   CONSTRAINT     f   ALTER TABLE ONLY public.partenariat
    ADD CONSTRAINT partenariat_pkey PRIMARY KEY (id_partenariat);
 F   ALTER TABLE ONLY public.partenariat DROP CONSTRAINT partenariat_pkey;
       public                 postgres    false    231            �           2606    16443    reservation reservation_pkey 
   CONSTRAINT     f   ALTER TABLE ONLY public.reservation
    ADD CONSTRAINT reservation_pkey PRIMARY KEY (id_reservation);
 F   ALTER TABLE ONLY public.reservation DROP CONSTRAINT reservation_pkey;
       public                 postgres    false    228            �           2606    16451    utilisateur utilisateur_pkey 
   CONSTRAINT     f   ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT utilisateur_pkey PRIMARY KEY (id_utilisateur);
 F   ALTER TABLE ONLY public.utilisateur DROP CONSTRAINT utilisateur_pkey;
       public                 postgres    false    229            )   �   x���AN�0EדS��(�vAH�THHl�L�q:%�+��N��(��Ү�?�?�^[��#���Š��BY[�f��v�"R���V���w1_J�}�#*��1~[��@���|��oRd�dB�`�)���Ӛ��`k��0�g97.S'e�&N��.���z�O�;�Yi1������m���˞=����[!(S�1>��G֦[F�����c���sL��W�;�d�X��5O�]p��(�����_      *   
   x������ � �      +   �  x�u�Kj�0���Sh?��[�W�i�,��u,�-7z��#��X�t���Z��>�_DÃ�� SM��27��4�ޢ��(٘l@wӔ�ɴ��[��=-����b*vX�@DԌՄ�D+��L��Ȥd}��pp�j��\t��R�h��0����K4ǥ��bE?����ŷׂ��b4�h�2��p+�]ʡ�
�ɗSbJ�[R���w(��5}�/�����j"k&JŤV|����j��Ƅ)�x�M���n�L櫯����(��$��R�9��ۋ�s���2���,1g��.)`?��q�u1�;�E֣h��tr|�O�`�k�g��d��z�f���n����1<��:��q��M~�\��\��{��хq�*��x���[      ,   �   x�]���  ��R�6 �k�����B`�k�
Q���I�Y�_���ɘa\�,:�+x���5E93Wޤ`�41��	��c C�1�i	�zC=��*u��Zc�7�B�)Z�,۟`]�y}�m�IݵR���.b      0   �   x�u�K�0EǏU�HTә�
��8b��R���qO�ÍI��&h��L�R�jD8��x딑P��dUTU��s��$�.���(�:������aP�̦&ť�t�E�2(�� �e�)
x���BSlûnjE��F�t��!	#p�p@�A�0�>L���nQ�ch��om�e�]V`7      -   �  x�Ŕ�r�0���Sh�Iq��8�pR��6Љ����RSQY
�U��˪��ʉCJ���<��O����$�A10�$A@�$ 30*��ɂB�L)���yyGr���u���vc�y�ZhE��
��Q�i�Q��c�a��� !+n��E	��%���WV0�$�9� ���B������fK`̕Nu�VT+�=��@#b�R�^4$׆W�Ud���Ř�Z;�k��>x���iWq���jak��q멍��àŎN�M1X�D�1����� F?�uF\T�L����	4=�-0=
4$�k:���if�Gt��~��̕��vS;�CտK���Q?LZ⸛lx��Z��l7��;(��9H|x
�=,9�uR�:Ĉ�����V+mjOO�#z�����ǘ1��A����c�U:�fE��RS,9��),���4�_��g�tΚMoj�T��RW$��{�F-4�A�����n)����]�̗L��O�8�=B��LҬ�|�$�TG�`�c���/
���hpRA�{_?�ZU������^��&G��j�_�wXQx:ܾ��]'^a�����Ñ6D�~v�[~ؑ��nRc\�
(��)T�U��̠�R>�8�A�@&�G�%����2<�xO���A���vrs���~ �H�      .   8  x�m��r�0��u�׀D�v�jq��
��M� QH$	T���a�h��;�g�k؀�5�b89AC�}9ՈT��`dd��>���B�vfzCF��:�ۤ��V\� z)/������?DƑ2L�P"$G���$�b�`�p�}�5��yu�}��2.�쭌�K,�`�<��n&K�<�gl�U�r����$�RD8����}��x�ȏ��^T�r������(�L�N,�zL��
�iȈ����(�qj�b(����V���^;(� ރ�w/�oa��7�f��ҲC�1u���s}���ߌ�WL�V�PE��f��     